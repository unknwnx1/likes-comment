import axios from "axios";

class Api {

    async push(username, id, apikey) {
        const data = await axios(`https://unknwnx.xyz/free/?apikey=${apikey}&username=${username}&id=${id}`, {
            timeout: 15000
        })

        const response = await data.data
        return response
    }




}

export default Api