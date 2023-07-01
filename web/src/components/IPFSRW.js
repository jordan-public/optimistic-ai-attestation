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