"use strict";
const QueueClient = require("./queue_client");

var message = {
  segmentID: "621b7a9a39f37e8855a5997b",
  service: {
    name: "Sendgrid",
    limits: [
      {
        name: "Minute",
        expiration: 1 * 60,
        maximum: 2,
      },
      {
        name: "Day",
        expiration: 1 * 60 * 60 * 24,
        maximum: 20,
      },
      {
        name: "Month",
        expiration: 1 * 60 * 60 * 24 * 30,
        maximum: 100,
      },
    ],
  },
  client: {
    name: "Abhinav&Co",
    apiKey: "dummy-key",
    number: "123456789",
    email: "abhinavmeenameena@gmail.com",
  },
  template: {
    templateID: "d-d96eda92999244679f968954bfe0cb4a",
    params: ["Agent", "Local Address"],
  },
};

let producer = new QueueClient("amqp://localhost", "amqp-test");

producer.waitForConnection(1000).then(() => {
  try {
    producer.produce(JSON.stringify(message), {
      persistent: true,
      contentType: "application/json",
    });
  } catch (error) {
    console.log(error);
  }
});

console.log(message);

setTimeout(() => {
  producer.disconnect();
}, 500);
