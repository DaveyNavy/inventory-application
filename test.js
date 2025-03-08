function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function main() {
  for (let i = 0; i < 5; i++) {
    await sleep(2000).then(() => {
      console.log("Hello");
    });
  }
}
main();
