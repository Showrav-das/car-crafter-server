const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;

const express = require("express");
const app = express();
var cors = require("cors");
const { default: Stripe } = require("stripe");
const port = process.env.PORT || 5000;
require("dotenv").config();
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.w5uf7.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();
    const database = client.db("Car_service");
    const productsCollection = database.collection("products");
    const detailsCollection = database.collection("details");
    const usersCollection = database.collection("users");
    const reviewsCollection = database.collection("reviews");
    app.get("/products", async (req, res) => {
      const query = {};
      const cursor = productsCollection.find(query);
      const homeProducts = await cursor.toArray();
      res.json(homeProducts);
    });

    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const query = { _id: ObjectId(id) };
      const detail = await productsCollection.findOne(query);
      res.json(detail);
      // console.log(detail);
    });

    app.get("/details", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      // console.log(query);
      const cursor = detailsCollection.find(query);
      const result = await cursor.toArray();
      res.json(result);
    });

    app.post("/details", async (req, res) => {
      const information = req.body;
      const result = await detailsCollection.insertOne(information);
      res.json(result);
    });

    // product add
    app.post("/products", async (req, res) => {
      const information = req.body;
      const result = await productsCollection.insertOne(information);
      res.json(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.json(result);
      //console.log(result)
    });
    //payment

    app.post("/api/payment", async (req, res) => {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2023-10-16",
      });
      // const body = await req.json();
      // console.log("body", req.body);
      const { amount, title } = req.body;
      console.log("amount ", amount, typeof amount);
      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "usd",
        metadata: {
          title,
        },
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    });

    //console.log(result)

    // review collection
    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.json(result);
      console.log(result);
    });
    // review upload
    app.get("/reviews", async (req, res) => {
      const query = {};
      const cursor = reviewsCollection.find(query);
      const homeProducts = await cursor.toArray();
      res.json(homeProducts);
    });
    // admin check
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      console.log(user);
      let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });

    // details found
    app.get("/details/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const query = { _id: ObjectId(id) };
      const detail = await detailsCollection.findOne(query);
      res.json(detail);
    });
    //delete
    app.delete("/details/:id", async (req, res) => {
      const query = req.params.id;
      //console.log(query);
      const id = { _id: new ObjectId(query) };
      //console.log(id);
      const result = await detailsCollection.deleteOne(id);
      //console.log(result);
      res.json(result);
    });
    app.delete("/products/:id", async (req, res) => {
      const id = { _id: ObjectId(req.params.id) };
      const result = await productsCollection.deleteOne(id);
      //console.log(result);
      res.json(result);
    });
    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      console.log("filter", filter);
      const options = { upsert: true };
      console.log("opton", options);
      const updateDoc = { $set: user };
      console.log("doc", updateDoc);
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });
    app.put("/users/admin", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const updateDoc = { $set: { role: "admin" } };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.json(result);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!hurrah");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
