type Image = {
    url: string;
};

export async function fetchImage(): Promise<Image> {
    const res = await fetch("https://api.thecatapi.com/v1/images/search");
    const images = await res.json();

    console.log("fetchImage: 画像情報を取得しました", images);

    return images[0];
}