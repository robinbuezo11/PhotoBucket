const { S3Client, HeadObjectCommand,} = require("@aws-sdk/client-s3");
const { RekognitionClient, CompareFacesCommand } = require("@aws-sdk/client-rekognition");

const AWS = require('aws-sdk');
const { config } = require("dotenv");
require('dotenv').config();

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

async function checkObjectExists(bucketName, objectKey) {
    try {
        const command = new HeadObjectCommand({ Bucket: bucketName, Key: objectKey });
        await s3.send(command);
        return true;
    } catch (error) {
        return false;
    }
}

const rekognition = new AWS.Rekognition({
    accessKeyId: process.env.REKOGNITION_ACCESS_KEY_ID,
    secretAccessKey: process.env.REKOGNITION_SECRET_ACCESS_KEY,
    region: process.env.REKOGNITION_REGION,
});

const config2 = {
    region: process.env.REKOGNITION_REGION,
    credentials: {
        accessKeyId: process.env.REKOGNITION_ACCESS_KEY_ID,
        secretAccessKey: process.env.REKOGNITION_SECRET_ACCESS_KEY
    }
};

const client = new RekognitionClient(config2);

async function compareImages(imageUrl, imageUrl2) {
    const imageName = imageUrl.split('/').pop();
    const imageName2 = imageUrl2.split('/').pop();

    const imageNameI1 = `Fotos_Reconocimiento_Facial/${imageName}`;
    const imageNameI2 = `Fotos_Reconocimiento_Facial/${imageName2}`;

    const existsI1 = await checkObjectExists(process.env.AWS_BUCKET_NAME, imageNameI1);
    const existsI2 = await checkObjectExists(process.env.AWS_BUCKET_NAME, imageNameI2);

    if (!existsI1 || !existsI2) {
        throw new Error('One or both images do not exist in the bucket.');
    }
    try {
        const params = {
            SimilarityThreshold: 80,
            SourceImage: {
                S3Object: {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Name: imageNameI1,
                },
            },
            TargetImage: {
                S3Object: {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Name: imageNameI2,
                },
            }
        };
        const result = await rekognition.compareFaces(params).promise();
        return result['FaceMatches'];
    } catch (error) {
        console.error('Error comparing images:', error);
        throw error;
    }
}

module.exports = compareImages;
