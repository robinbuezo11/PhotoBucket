const AWS = require('aws-sdk');

AWS.config.update({
    accessKeyId: process.env.REKOGNITION_ACCESS_KEY_ID,
    secretAccessKey: process.env.REKOGNITION_SECRET_ACCESS_KEY,
    region: process.env.REKOGNITION_REGION,
});

const rekognition = new AWS.Rekognition();

async function compareImages(imageUrl, imageUrl2) {
    const imageName = imageUrl.split('/').pop();
    const imageName2 = imageUrl2.split('/').pop();
    try {

        const params = {
            SimilarityThreshold: 80,
            SourceImage: {
                S3Object: {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Name: imageName
                },
            },
            TargetImage: {
                S3Object: {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Name: imageName2
                },
            }
        };
        const result = await rekognition.compareFaces(params).promise();
        return result;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

module.exports = compareImages;
