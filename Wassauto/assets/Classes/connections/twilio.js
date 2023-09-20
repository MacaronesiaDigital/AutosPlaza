const accountSid = "ACfa420b901227e9bf34ec87688215215e";
const authToken = "8c03962561d86cd815c207ea1855797d";
const client = require("twilio")(accountSid, authToken);
const config = require("../../../config");

function sendTextMessage(recipient, message) {
  console.log(message);
  return new Promise((resolve, reject) => {
    client.messages
      .create({
        from: 'whatsapp:'+ config.PHONENUMBER,
        body: message,
        to: 'whatsapp:+' + recipient,
      })
      .then((message) => resolve())
      .catch((err) => reject(err));
  });
}

function sendLocationMessage(recipient, latitude, longitude) {
  const message = {
    body: 'Ubicación',
    from: 'whatsapp:'+ config.PHONENUMBER,
    to: 'whatsapp:+' + recipient,
    persistentAction: ['geo:' + latitude + ',' + longitude]
  };

  client.messages
    .create(message)
    .then((response) => {
      console.log('Location message sent:', response.sid);
    })
    .catch((error) => {
      console.error('Error sending location message:', error);
    });
}

function sendMediaMessage(recipient, imageUrl) {
  const message = {
    body: '',
    from: 'whatsapp:'+ config.PHONENUMBER,
    to: 'whatsapp:' + recipient,
    mediaUrl: imageUrl
  };

  console.log(message);

  client.messages
    .create(message)
    .then((response) => {
      console.log('Image message sent:', response.sid);
    })
    .catch((error) => {
      console.error('Error sending image message:', error);
    });
}

module.exports = {
  sendTextMessage, sendLocationMessage, sendMediaMessage,
};