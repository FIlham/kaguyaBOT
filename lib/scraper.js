const axios = require("axios").default
const cheerio = require("cheerio")

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

// tiktokdl("https://vt.tiktok.com/ZS8qmVHoe/")
// .then(res => console.log(res))
// .catch(err => console.log(err))

module.exports = {
    instagramdl,
    tiktokdl
}