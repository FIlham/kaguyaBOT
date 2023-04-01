const axios = require("axios").default
const cheerio = require("cheerio")
const { getVideoID } = require("ytdl-core")

const youtubedl = (url) => {
    return new Promise(async (resolve, reject) => {
        try {
            let yId = getVideoID(url)
            let y2mateReq = await axios({
                url: "https://www.y2mate.com/mates/analyzeV2/ajax",
                method: "post",
                headers: {
                    "accept": '*/*',
                    "user-agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
                    "x-requested-with": "XMLHttpRequest"
                },
                data: new URLSearchParams(Object.entries({ k_query: "https://youtu.be/" + yId, k_page: "home", hl: "en", q_auto: 0 }))
            })
            let mp3req = await axios({
                url: "https://www.y2mate.com/mates/convertV2/index",
                method: "post",
                headers: {
                    "accept": '*/*',
                    "user-agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
                    "x-requested-with": "XMLHttpRequest"
                },
                data: new URLSearchParams(Object.entries({ vid: yId, k: y2mateReq.data.links.mp3["mp3128"].k }))
            })
            let mp4req = await axios({
                url: "https://www.y2mate.com/mates/convertV2/index",
                method: "post",
                headers: {
                    "accept": '*/*',
                    "user-agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
                    "x-requested-with": "XMLHttpRequest"
                },
                data: new URLSearchParams(Object.entries({ vid: yId, k: y2mateReq.data.links.mp4["135"].k }))
            })
            resolve({
                title: y2mateReq.data.title,
                thumbnail: `https://i.ytimg.com/vi/${yId}/sddefault.jpg`,
                mp3: {
                    dlink: mp3req.data.dlink,
                    size: y2mateReq.data.links.mp3["mp3128"].size
                },
                mp4: {
                    dlink: mp4req.data.dlink,
                    size: y2mateReq.data.links.mp4["135"].size
                }
            })
        } catch (e) {
            reject(e)
        }
    })
}

const instagramdl = async (url) => {
    return new Promise(async (resolve, reject) => {
        const BASE_URL = "https://instasupersave.com/"

        //New Session = Cookies
        try {
            const resp = await axios(BASE_URL);
            const cookie = resp.headers["set-cookie"]; // get cookie from request
            const session = cookie[0].split(";")[0].replace("XSRF-TOKEN=", "").replace("%3D", "")

            //REQUEST CONFIG
            var config = {
                method: 'post',
                url: `${BASE_URL}api/convert`,
                headers: {
                    'origin': 'https://instasupersave.com',
                    'referer': 'https://instasupersave.com/pt/',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 Edg/107.0.1418.52',
                    'x-xsrf-token': session,
                    'Content-Type': 'application/json',
                    'Cookie': `XSRF-TOKEN=${session}; instasupersave_session=${session}`
                },
                data: {
                    url: url
                }
            };

            //REQUEST
            axios(config).then(function (response) {
                let ig = []
                if (Array.isArray(response.data)) {
                    response.data.forEach((post) => { ig.push(post.sd === undefined ? post.thumb : post.sd.url) })
                } else {
                    ig.push(response.data.url[0].url)
                }

                resolve({
                    results_number: ig.length,
                    url_list: ig
                })
            })
                .catch(function (error) {
                    reject(error.message)
                })
        } catch (e) {
            reject(e.message)
        }
    })
}

const tiktokdl = async (url) => {
    return new Promise(async (resolve, reject) => {
        try {
            let { data } = await axios({
                method: "post",
                headers: {
                    "Content-Type": 'application/json',
                    "Cookie": 'lang=en; _ga=GA1.1.1436334956.1679497147; __gads=ID=bb4246a265d1e4e5-22273e728edc0088:T=1679547547:RT=1679547547:S=ALNI_MbBgCV5ZKgXQPhBAIIH4gkntRHRrw; uid=21af31db4b22f9633042fb87ca283b66; _ga_233R9NY1HK=GS1.1.1679553424.2.0.1679553424.0.0.0; __gpi=UID=00000bdeb3944e57:T=1679547547:RT=1679603824:S=ALNI_MYcMzYfJ1G8CuvJ-R5DH2FYhmxDgw'
                },
                url: "https://downloader.bot/api/tiktok/info",
                data: { url }
            })
            resolve(data.data)
        } catch (e) {
            reject(e)
        }
    })
}

const mediafdl = (url) => {
    return new Promise(async (resolve, reject) => {
        try {
            let { data } = await axios.get(url)
            let $ = cheerio["load"](data)
            let dlink = $("#downloadButton").attr("href")
            let filesize = $("#downloadButton").text().trim()
            resolve({
                title: $("body > main > div.content > div.center > div > div.dl-btn-cont > div.dl-btn-labelWrap > div.promoDownloadName.notranslate > div").text().trim(),
                dlink,
                filesize: filesize.match(/[0-9]/g).join("") + " " + filesize.match(/(MB|KB)/g),
                ext: dlink.split(".").reverse()[0]
            })
        } catch (e) {
            reject(e)
        }
    })
}

const facebookdl = (url) => {
    return new Promise(async (resolve, reject) => {
        try {
            let { data } = await axios({
                method: "post",
                url: "https://api.getfb.net/Facebook/DetectVideoInfo",
                headers: {
                    "Accept": '/',
                    "Content-Type": "application/json"
                },
                data: JSON.stringify({ id: "", videoId: url, html: "" })
            })

            resolve(data.result)
        } catch (error) {
            reject(error)
        }
    })
}

const pinterestdl = (url) => {
    return new Promise(async (resolve, reject) => {
        try {
            let { data } = await axios({
                url: "https://www.expertsphp.com/twitter-video-downloader.php",
                method: "post",
                data: new URLSearchParams(Object.entries({ url }))
            })
            let $ = cheerio["load"](data)
            let dlink = $('a[title="Right Click and Save to start Downloading"]').attr("href")

            resolve({
                dlink,
                ext: dlink.split(".").reverse().shift() || undefined
            })
        } catch (error) {
            reject(error)
        }
    })
}

// pinterestdl("https://id.pinterest.com/pin/690598924100998127/")
// .then(res => console.log(res))
// .catch(err => console.log(err))

module.exports = {
    instagramdl,
    tiktokdl,
    youtubedl,
    mediafdl,
    facebookdl,
    pinterestdl
}