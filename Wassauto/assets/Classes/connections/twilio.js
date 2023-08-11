const accountSid = "ACfa420b901227e9bf34ec87688215215e";
const authToken = "989048549b1c89772061396432438616";
const client = require("twilio")(accountSid, authToken);

function sendTextMessage(recipient, message) {
  return new Promise((resolve, reject) => {
    client.messages
      .create({
        from: 'whatsapp:+14155238886',
        body: message,
        to: 'whatsapp:+' + recipient,
      })
      .then((message) => resolve())
      .catch((err) => reject(err));
  });
}

function sendButtonsToWhatsApp(recipient, buttons) {
  const message = {
    body: 'Please select an option:',
    from: 'whatsapp:+14155238886',
    to: 'whatsapp:+' + recipient,
    provideFeedback: true,
    provideFeedbackForDelivered: true,  
    statusCallback: 'https://example.com/callback',
    mediaUrl: ['https://example.com/image.jpg'],
    buttons: buttons
  };

  client.messages
    .create(message)
    .then(message => console.log(message.sid))
    .catch(err => console.error(err));
}

function sendLocationMessage(recipient, latitude, longitude) {
  const message = {
    body: 'Ubicación',
    from: 'whatsapp:+14155238886',
    to: 'whatsapp:' + recipient,
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

function sendImageMessage(recipient, imageUrl) {
  const message = {
    body: '',
    from: 'whatsapp:+14155238886',
    to: 'whatsapp:' + recipient,
    mediaUrl: imageUrl
  };

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
  sendTextMessage, sendButtonsToWhatsApp, sendLocationMessage, sendImageMessage,
};