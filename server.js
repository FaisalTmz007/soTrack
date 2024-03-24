const app = require("./src/app");

<<<<<<< HEAD
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
=======
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
>>>>>>> 1325a03ae85a15bb36187a64f30db0ae173482a6
});
