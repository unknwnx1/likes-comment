import {
    withFbns
} from "instagram_mqtt";
import {
    IgApiClient
} from "instagram-private-api";
import chalk from "chalk";
import moment from "moment";
import fs from "fs";
import 'dotenv/config';
import Api from "./data/index.js";

async function comment() {
    const file = fs.readFileSync("listcomment.txt", "utf-8")
    const split = file.split("\n");
    const result = split[Math.floor(Math.random() * split.length)]
    return result
}

async function openState(username) {
    const open = fs.readFileSync("./state/" + username + ".json", "utf-8")
    return open

}

async function login(username, password) {
    try {
        const ig = new IgApiClient()
        ig.state.generateDevice(username)
        const login = await ig.account.login(username, password)
        if (login.username == username) {
            console.log(chalk.green(`[ ${moment().format("HH:mm:ss")} ] login successfully with ${login.full_name}`));
            console.log(chalk.green(`[ ${moment().format("HH:mm:ss")} ] saving state for account ${login.full_name}`));
            const state = await ig.state.serialize()
            delete state.constants
            const parse = JSON.stringify(state)
            fs.appendFileSync("./state/" + username + ".json", parse, "utf-8")
            console.log(chalk.green(`[ ${moment().format("HH:mm:ss")} ] successfully saving state try to next proccess`));
        }
    } catch (err) {
        console.log(err);
    }
}

async function task() {
    try {
        const api = new Api()
        const username = process.env.USERNAME_IG
        const password = process.env.PASSWORD_IG
        const apikey = process.env.APIKEY

        if (!fs.existsSync("./state/" + username + ".json")) {
            await login(username, password)
        }
        const state = await openState(username)
        const ig = withFbns(new IgApiClient())
        const loginWithState = await ig.state.deserialize(state)

        //notify
        console.log(chalk.green(`[ ${moment().format("HH:mm:ss")} ] waiting for new post target ...`));
        ig.fbns.on("push", async (data) => {
            const targetAll = data.message.split(" ")[0];
            if (data.message === `${targetAll} just posted a photo.` ||
                data.message === `${targetAll} just posted a video.` ||
                data.message === `${targetAll} just made a post.`) {

                console.log(chalk.blue(`[ ${moment().format("HH:mm:ss")} ] ${targetAll} add new post`));
                const id = data.actionParams.media_id.split("_")[0]
                //try to comment
                const textKomentar = await comment()
                const komentar = await ig.media.comment({
                    mediaId: id,
                    text: textKomentar

                })
                if (komentar.status == "Active") {
                    console.log(
                        chalk.green(
                            `[ ${moment().format("HH:mm:ss")} ] Berhasil komentar`, textKomentar
                        )
                    );
                    console.log(chalk.blue(`[ ${moment().format("HH:mm:ss")} ] trying input to server id comment : ${komentar.pk}`));
                    const input = await api.push(username, komentar.pk, apikey)
                    if (input.status == 'ok') {
                        console.log(chalk.yellow(`[ ${moment().format("HH:mm:ss")} ] waiting for proccess likes in comment ...`));
                        console.log(chalk.blue(`[ ${moment().format("HH:mm:ss")} ] Sisa credit anda : ${input.data.credit} | sisa masa aktif : ${input.data.expired} Hari`));

                    } else {
                        console.log(chalk.red(`[ ${moment().format("HH:mm:ss")} ] Gagal input server response : `, input.data));

                        process.exit()


                    }

                } else {
                    console.log(chalk.red(`[ ${moment().format("HH:mm:ss")} ] gagal komentar`, komentar.status));

                }


            }

        })

        await ig.fbns.connect()



    } catch (error) {
        console.log(error.message);
    }

}

task().catch((err) => {
    console.log(err.message);
})