import createError from "http-errors";
import httpErrorHandler from "@middy/http-error-handler";
import middy from "@middy/core";
import { dynamodbQuery } from "./getAuctionById";
import { setPictureUrl } from "../lib/setPictureUrl";
import { uploadImageS3 } from "../lib/uploadImageS3";

export async function uploadAuctionPicture(event) {
  const { id } = event.pathParameters;
  const auction = await dynamodbQuery(id);
  const base64 = event.body.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64, "base64");

  let updatedAuction;
  try {
    const pictureUrl = await uploadImageS3(auction.id + ".jpg", buffer);
    updatedAuction = await setPictureUrl(auction.id, pictureUrl);
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ updatedAuction }),
  };
}

export const handler = middy(uploadAuctionPicture).use(httpErrorHandler());
