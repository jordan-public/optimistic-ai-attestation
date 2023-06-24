import { create } from 'ipfs-http-client';
const ipfs = create({ host: '127.0.0.1', port: 5001, protocol: 'http' });
import axios from 'axios';
import dotenv from 'dotenv';


async function addFile(content) {
    const { path } = await ipfs.add(content);
    await ipfs.pin.add(path);
    return path;
}

async function getFile(cid) {
    const stream = ipfs.cat(cid);
    let data = "";

    for await (const chunk of stream) {
        data += new TextDecoder().decode(chunk);
    }

    return data;
}

const cid = process.argv[2];
getFile(cid)
    .then((r) => {
        const attestationRequest = JSON.parse(r);

        const verificationQuestion = "Here is a question that you were asked and your answer. Respond with only a number from 0 to 1 about the likelihood that this answer was actually produced by you:\n";
        const toVerify = "Question:\n" + attestationRequest.question + "\nAnswer\n";

        dotenv.config({ path: '../.env' });
        const apiKey = process.env.OPENAI_API_KEY;

        const data = {
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: verificationQuestion + toVerify }],
            temperature: 0.0,
        };

        axios.post('https://api.openai.com/v1/chat/completions', data, {
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Bearer " + apiKey
            }
          }).then(response => {
            const answer = response.data.choices[0].message.content;
            console.log(answer);
          }).catch(error => {
            console.log('Error:', error.response ? error.response.status : error.message);
          });
    })
    .catch(console.error);
