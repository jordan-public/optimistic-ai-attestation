import  { CID } from 'multiformats';

export async function addFile(content, ipfs) {
    const { path } = await ipfs.add(content);
    await ipfs.pin.add(path);
    return path;
}

export async function getFile(cid, ipfs) {
    const stream = ipfs.cat(cid);
    let data = "";

    for await (const chunk of stream) {
      data += new TextDecoder().decode(chunk);
    }

    return data;
}

export function uint8ArrayToHexString(byteArray) {
    return Array.from(byteArray, byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');
}

export function hexStringToUint8Array(hexString) {
    if (hexString.length % 2 !== 0) {
        console.log("Invalid hexadecimal string passed to conversion function.");
        return new Uint8Array();
    }

    var bytes = new Uint8Array(Math.floor(hexString.length / 2));

    for (let i = 0; i < hexString.length; i+=2) {
        bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
    }

    return bytes;
}

export function bytes32StringToCID(bytes32) {
    let multihashVerify = new Uint8Array(34);
    multihashVerify.set([0x12, 0x20]);
    multihashVerify.set(hexStringToUint8Array(bytes32.slice(2)), 2);
    return CID.createV0(decode(multihashVerify)).toString();
}

export function cidToBytes32String(cid) {
    return '0x' + uint8ArrayToHexString(CID.parse(cid).bytes.slice(2));               
}