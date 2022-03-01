"use strict";
const QueueClient = require("./queue_client");
const Redis = require("Redis");
const { default: axios } = require("axios");
const app = require("./app");
const Segment = require("./models/Segments");

const redisClient = Redis.createClient();
redisClient.on("connect", () => console.log("Connected to Redis!"));
redisClient.on("error", (err) => console.log("Redis Client Error", err));
redisClient.connect();

let consumer = new QueueClient("amqp://localhost", "amqp-test");

consumer.waitForConnection(1000).then(() => {
  try {
    consumer.setPrefetch(1);
    consumer.consume(async (data) => {
      if (data === null) {
        return;
      }

      let mssg = JSON.parse(data.content.toString());

      const overLimit = await checkAPILimit(mssg);
      if (overLimit) {
        consumer.acknowledge(data);
        consumer.produce(JSON.stringify(mssg), {
          persistent: true,
          contentType: "application/json",
        });
      } else {
        // consumer.acknowledge(data);
        await workerFunction(mssg);
        incrementAPICount(mssg);
        consumer.acknowledge(data);
      }
    });
  } catch (error) {
    console.log(error);
  }
});

const workerFunction = async (mssg) => {
  console.log(mssg);
  switch (mssg.service.name) {
    case "MSG91":
      return await sendBulkSmsMSG91(mssg);
    case "Sendgrid":
      return await sendBulkEmailSendgrid(mssg);
    default:
      throw new Error("No service name Available");
  }
};

const createPhnNumber = (phNumber, countryCode = 91) => {
  let number = countryCode + phNumber.toString();
  number = parseInt(number, 10);
  return number;
};

const sendBulkSmsMSG91 = async (mssg) => {
  const url = process.env.MSG91_URL_BULK_SMS;

  const users = await getUsersFromSegmentID(mssg.segmentID);

  const recipients = users.map((user) => {
    let recipient = {
      mobiles: createPhnNumber(user.number),
    };

    mssg.template.params.forEach((param, index) => {
      recipient[`var${index + 1}`] = param;
    });
    return recipient;
  });

  const body = {
    authkey: mssg.client.apiKey,
    recipients: recipients,
    flow_id: mssg.template.templateID,
  };

  const response = await axios.post(url, body);
  return response;
};

const sendBulkEmailSendgrid = async (mssg) => {
  let url = process.env.SENDGRID_URL_BULK_EMAIL;
  let config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${mssg.client.apiKey}`,
    },
  };

  const users = await getUsersFromSegmentID(mssg.segmentID);

  let data = {
    personalizations: users.map((user) => {
      return {
        to: [{ email: user.email, name: user.name }],
        dynamic_template_data: {
          recipient_name: user.name,
        },
        subject: mssg.template.params[0],
      };
    }),
    from: {
      email: mssg.client.email,
      name: mssg.client.name,
    },
    reply_to: {
      email: mssg.client.email,
      name: mssg.client.name,
    },
    template_id: mssg.template.templateID,
  };

  const response = await axios.post(url, data, config);
  return response;
};

const incrementAPICount = (mssg) => {
  mssg.service.limits.forEach(async (limit) => {
    await redisClient.incr(getRedisKey(mssg, limit));
  });
};

const getRedisKey = (mssg, limit) => {
  return mssg.service.name + "-" + mssg.client.apiKey + "-" + limit.name;
};

const checkAPILimit = async (mssg) => {
  const dayLimit = 1 * 60 * 60 * 24;

  const checkLimit = await asyncSome(mssg.service.limits, async (limit) => {
    var count = await redisClient.incr(getRedisKey(mssg, limit));
    const overLimit = parseInt(count, 10) > limit.maximum;
    if (overLimit && limit.expiration > dayLimit)
      throw new Error("API Limit exceeded: " + limit.maximum);
    return overLimit;
  });
  return checkLimit;
};

const getUsersFromSegmentID = async (segmentID) => {
  const segment = await Segment.findById(segmentID).lean().populate("users");
  return segment.users;
};

const asyncSome = async (arr, predicate) => {
  for (let e of arr) {
    if (await predicate(e)) return true;
  }
  return false;
};
