#!/usr/bin/env node

const player = require("play-sound")((opts = {}));
const inquirer = require("inquirer");
const axios = require("axios");
const HTMLParser = require("node-html-parser");
const dayjs = require("dayjs");

const weGotOne = () => {
  return player.play("./sounds/we-got-one.mp3");
};

const getZipcode = () => {
  return inquirer.prompt({
    name: "zipcode",
    message: "What is your zip code?",
    validate: (zipcodeMaybe) => {
      return /^[0-9]{5}(?:-[0-9]{4})?$/.test(zipcodeMaybe);
    },
  });
};

const getDistance = () => {
  return inquirer.prompt({
    name: "distance",
    message: "How far do you want to search(miles)?",
    type: "list",
    choices: [25, 50, 75],
    default: 25,
  });
};

const logStore = (storeRow, type) => {
  console.log(
    `Stock: ${storeRow.childNodes[2].childNodes[0].rawText} - ${type} ${storeRow.childNodes[0].childNodes[0].rawText}`
  );
};

const logGamestop = (storeRow) => {
  return logStore(storeRow, "Gamestop");
};

const logTarget = (storeRow) => {
  return logStore(storeRow, "Target");
};

const checkTarget = async (zipcode, distance) => {
  const url = `https://popfindr.com/results?pid=207-41-0001&zip=${zipcode}&range=${distance}&webpage=target&token=03AGdBq27_Qd5fFPOJ-ekYtwVpeS7JgUCJ4l_nBe0PoX_6h1yCdzjDcT6c7PD-zoyWGFkZ_8YbQjqgzc37XTEPLkZh5uY3-yiZm-SXAtyQp2oreOSmSX4r18d2jioMYZICu6jufFwlzKkxsKZXSKKHjituomQksfBbPTg7UQzC3lmy5vS19THGUbOhVkwwSzHTOVPWmlgW2NdCae2gIrcV68tYXpV5muArRSeFLOVbePOa4n_mJT7cDyaY5F9jHoN6acCZsLvOL5NBBPmG5KuaztB17LyS0GNivUdwinbkWmuUkM0-uFEw39dD58AyoA45cs7nMw195thQMwpbCyxC6VhMKnOhnD3lqnVNUd0PFeEIruBDIUfzctaGg7Dd8piaTvYffICoaKkjbpn7qtJKwHH88_0CJ6Jiyyheew8TV6i9XcxwvfMmsIEoYWMvDO1ljGPIJ8pTpPNS`;

  let pageContent;

  console.log(
    `[${dayjs()}] Checking Targets within ${distance} miles of ${zipcode}.`
  );

  await axios.get(url).then((resp) => {
    pageContent = HTMLParser.parse(resp.data);
  });

  const storeRows = pageContent
    .querySelectorAll("tbody")[1]
    .childNodes.filter((maybeRow) => {
      return maybeRow.rawTagName === "tr";
    });

  if (!storeRows.length) {
    console.log("No Target stores found.");
    console.log(pageContent.querySelectorAll("tbody")[1].childNodes);
    return;
  }

  const storesWithStock = storeRows.filter((tableRow) => {
    return parseInt(tableRow.childNodes[2].childNodes[0].rawText) > 0;
  });

  if (storesWithStock.length) {
    storesWithStock.forEach(logTarget);
    weGotOne();
    process.exit();
  }

  console.log(`${storesWithStock.length} Targets with inventory found.`);
};

const checkGamestop = async (zipcode, distance) => {
  const url = `https://popfindr.com/results?pid=224744&zip=${zipcode}&range=${distance}&webpage=gamestop&token=03AGdBq27joniO_jR_NgAmwT6SfTWkYaeV0U9Fvf0CPykvxr8YOMNhQO6vIxb_nOXfOGqh_K7nVg98KERJX7xj2814IWRfpfrjWJ0Go9xAJ3mixqtlNxFQAtx-LfhBJmgk0X1AUkwxv_Y_xrr3t3pJu6wCGSFarj6ZNaoqLCAvVWKFECSvihugwIGGsC4mIiXjYpNvOgVTlbvSmK7UnNUoLj9BIsmtkrHtAaWiiVOxaWxXZJodepDpTArp64DWwK_SeC58azeEaMRUiB-HC1GZ-PD-ff3E_q-eCYU_54utu6jgNCwjl3jGWAqzpWAi6nA1FQ-o1hKLWNY_q8zEGsP58p0zcmYX2dC9SxVrfuAeyxyjWw__Eb-g3XJpAM4szrDB2LkQvsmjffpujOdQ9fNf801HDtwk6dBSFC3hbfN6ZCrVcezbYWOEWEr5CwMDvWEFXq_5c1ibPypt`;
  let pageContent;

  console.log(
    `[${dayjs()}] Checking Gamestops within ${distance} miles of ${zipcode}.`
  );

  await axios.get(url).then((resp) => {
    pageContent = HTMLParser.parse(resp.data);
  });

  const storeRows = pageContent
    .querySelectorAll("tbody")[1]
    .childNodes.filter((maybeRow) => {
      return maybeRow.rawTagName === "tr";
    });

  if (!storeRows.length) {
    console.log("No Gamestop stores found.");
    console.log(pageContent.querySelectorAll("tbody")[1].childNodes);
    return;
  }

  const storesWithStock = storeRows.filter((tableRow) => {
    return parseInt(tableRow.childNodes[2].childNodes[0].rawText) > 0;
  });

  if (storesWithStock.length) {
    storesWithStock.forEach(logGamestop);
    weGotOne();
    process.exit();
  }

  console.log(`${storesWithStock.length} Gamestops with inventory found.`);
};

const start = async () => {
  const { zipcode } = await getZipcode();
  const { distance } = await getDistance();

  console.log("Preparing to search...");

  setInterval(async () => {
    await checkGamestop(zipcode, distance);
  }, 10000);

  setTimeout(async () => {
    setInterval(async () => {
      await checkTarget(zipcode, distance);
    }, 10000);
  }, 7500);
};

start();
