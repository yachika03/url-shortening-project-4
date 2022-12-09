const shortid = require("shortid")
const urlValidation = require("url-validation")
const urlModel = require("../Model/urlModel")
const redis = require("redis");
const { promisify } = require("util");

//Connect to redis
const redisClient = redis.createClient(
    11480,
    "redis-11480.c212.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
);
redisClient.auth("PhvvwtqDaSlZK3eKsULRNFnQoX59yV7V", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
});

//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);
const DEL_ASYNC = promisify(redisClient.DEL).bind(redisClient);
const EXP_ASYNC = promisify(redisClient.EXPIRE).bind(redisClient);


const validUrl = function (value) {
    if (value == undefined) { return "Url is mandatory" }
    if (typeof value !== "string") { return "Url must be in string" }
    if (value.trim() == "") { return "Url can not be empty" }
    if (!urlValidation(value)) { return "Invalid URL" }
    return true
}



const shortenURL = async function (req, res) {
    try {
        let body = req.body

        if (Object.keys(body).length == 0) return res.status(400).send({ status: false, message: "please enter url in body" })

        let { originalUrl, ...rest } = body;

        if (Object.keys(rest).length > 0) return res.status(400).send({ status: false, message: `You can not fill these:-( ${Object.keys(rest)} ) data ` })

        if (validUrl(originalUrl) != true) return res.status(400).send({ status: false, message: `${validUrl(longUrl)}` })


        //  ------------- url_in_Cache ------------- 
        let url_in_Cache = await GET_ASYNC(`${longUrl}`)
        if (url_in_Cache) {
            return res.status(200).send({ status: true, message: "Url is already present", data: JSON.parse(url_in_Cache) })
        }

        //  ------------- url_in_DB ------------- 
        let url_in_DB = await urlModel.findOne({ longUrl: longUrl }).select({ _id: 0, updatedAt: 0, createdAt: 0, __v: 0 })
        if (url_in_DB) {
            await SET_ASYNC(`${longUrl}`, JSON.stringify(url_in_DB))

            return res.status(200).send({ status: true, message: "LongUrl is already present", shortUrl: url_in_DB.shortUrl })
        }


        let urlCode = shortid.generate().toLowerCase()

        let shortUrl_in_DB = await urlModel.findOne({ urlCode: urlCode })
        if (shortUrl_in_DB) return res.status(409).send({ status: false, message: "shortUrl is already present" })

        let port = req.get("host")

        // let baseurl = "http://localhost:3000/"
        let baseurl = `http://localhost:${port}/`
        let shortUrl = baseurl + urlCode
        longUrl = originalUrl.trim()


        let createdData = await urlModel.create({ shortUrl, urlCode, longUrl })
        let data = {
            urlCode: createdData.urlCode,
            shortUrl: createdData.shortUrl,
            longUrl: createdData.longUrl
        }

        return res.status(201).send({ status: true, message: "sortUrl successfully created", data: data })

    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }

}


const getUrl = async function (req, res) {
    try {


        let urlCode = req.params.urlCode

        if (!shortid.isValid(urlCode)) return res.status(400).send({ status: false, message: `Invalid urlCode: - ${urlCode}` })

        let cachedUrl = await GET_ASYNC(`${req.params.urlCode}`)
        if (cachedUrl) { return res.status(302).redirect(cachedUrl) }

        else {
            let url = await urlModel.findOne({ urlCode: urlCode })//.select({ longUrl: 1, _id: 0 })

            if (!url) return res.status(404).send({ status: false, message: `${urlCode} urlCode not found` })
            const setCache = await SET_ASYNC(`${req.params.urlCode}`, JSON.stringify(url.longUrl))

            const exp = await EXP_ASYNC(`${req.params.urlCode}`, 20)

            return res.status(302).redirect(url.longUrl)
        }

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}



const deleteUrl = async function (req, res) {
    try {
        let urlCode = req.params.urlCode

        if (!shortid.isValid(urlCode)) return res.status(400).send({ status: false, message: `Invalid urlCode: - ${urlCode}` })

        let deletedUrl = await DEL_ASYNC(`${urlCode}`)
        if (deletedUrl == 0) return res.send(`no cache found`)
        return res.send(`cache deleted successful`)

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}
module.exports = { shortenURL, getUrl, deleteUrl }