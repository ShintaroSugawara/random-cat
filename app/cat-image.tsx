"use client";

import { useState } from "react";
import { fetchImage } from "./fetch-image";

type CatImageProps = {
    url: string;
};

export function CatImage({ url }: CatImageProps) {
    const [imageUrl, setImageUrl] = useState(url);

    const refreshImage = async () => {
        setImageUrl("");
        const image = await fetchImage();
        setImageUrl(image.url);
    }
    return (
        <div>
            <button onClick={refreshImage}>他のにゃんこも見る</button>

            {imageUrl && <img src={imageUrl} />}
        </div>
    );
}