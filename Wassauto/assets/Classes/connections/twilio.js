//const accountSid = "ACfa420b901227e9bf34ec87688215215e";
//const authToken = "8c03962561d86cd815c207ea1855797d";
const config = require("../../../config");
const accountSid = config.TWILIO_ACC_SID;
const authToken = config.TWILIO_AUTH;
const client = require("twilio")(accountSid, authToken);

function sendTextMessage(recipient, message) {
  console.log(message);
  //if(recipient != "34671152525") { return }
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
    body: 'Google Maps',
    from: 'whatsapp:'+ config.PHONENUMBER,
    to: 'whatsapp:+' + recipient,
    PersistentAction: ['geo:' + latitude + ',' + longitude]
  };
  console.log(message);
  return new Promise((resolve, reject) => {
    client.messages
      .create(message)
      .then((message) => resolve())
      .catch((err) => console.log(err) );
  });
}

function sendMediaMessage(recipient, imageUrl) {
  try{
    const message = {
      body: '',
      mediaUrl: imageUrl ,
      from: 'whatsapp:'+ config.PHONENUMBER,
      to: 'whatsapp:+' + recipient
    };
  
    console.log(message);
    return new Promise((resolve, reject) => {
      client.messages
        .create(message)
        .then((message) => resolve())
        .catch((err) => reject(err));
    });
  } catch(error){
    console.log(error);
  }
  
}

module.exports = {
  sendTextMessage, sendLocationMessage, sendMediaMessage,
};