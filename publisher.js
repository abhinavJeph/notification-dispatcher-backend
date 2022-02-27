"use strict";
const QueueClient = require("./queue_client");

var message = {
  segmentID: "621b7a9a39f37e8855a5997b",
  service: {
    name: "MSG91",
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
    apiKey: "332347AkkjFe54vCZ35ee48ddfP1",
    number: "123456789",
    email: "abhinavCo@gmail.com",
  },
  template: {
    templateID: "60e187c75088fe6e696ad9ea",
    params: ["Agent", "Local Address"],
  },
};

let producer = new QueueClient("amqp://localhost", "amqp-test");

producer.waitForConnection(1000).then(() => {
  producer.produce(JSON.stringify(message), {
    persistent: true,
    contentType: "application/json",
  });
});

console.log(message);

setTimeout(() => {
  producer.disconnect();
}, 500);
