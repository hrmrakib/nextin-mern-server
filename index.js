const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 4000;

const { MongoClient, ServerApiVersion } = require("mongodb");

// I use only index.js file for the small project.
// I use the structure if project will be complex:
// src/
//     config/
//     controllers/
//     middleware/
//     models/
//     routes/
//     utils/
//     index.js

app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://nextin-app.vercel.app/",
    ],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

const uri =
  "mongodb+srv://airbnb:raeOVKfYhTXkr3Bh@cluster0.dmwxvyo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// const uri = "mongodb://localhost:27017";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // database
    const db = client.db("airbnb");

    // collections
    const categoriesCollection = db.collection("categories");

    // home route
    app.get("/", (req, res) => {
      res.send("Hello, I am running!");
    });

    // get categories data based on filter value, otherwise fetch all categories
    app.get("/api/categories", async (req, res) => {
      try {
        const param = req.query.searchQuery;
        const query = { category: param };

        // if have any query, run the if block of code
        if (param) {
          const categories = await categoriesCollection.find(query).toArray();
          return res.send(categories);
        }
        const categories = await categoriesCollection.find().toArray();
        res.send(categories);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // place filter
    app.get("/api/type-of-place", async (req, res) => {
      try {
        const param = req.query;

        const searchQuery = { category: param.searchQuery };
        const typeQuery = { type: param.type };

        if (param.type === "any") {
          const findMinMaxPrice = await categoriesCollection
            .aggregate([
              {
                $match: {
                  category: searchQuery.category,
                },
              },
              {
                $group: {
                  _id: null,
                  minRate: {
                    $min: "$price.rate",
                  },
                  maxRate: {
                    $max: "$price.rate",
                  },
                },
              },
            ])
            .toArray();
          const typeOfPlace = await categoriesCollection
            .find(searchQuery)
            .toArray();

          return res.send({ typeOfPlace, findMinMaxPrice });
        } else if (param) {
          const findMinMaxPrice = await categoriesCollection
            .aggregate([
              {
                $match: {
                  $and: [searchQuery, typeQuery],
                },
              },
              {
                $group: {
                  _id: null,
                  minRate: {
                    $min: "$price.rate",
                  },
                  maxRate: {
                    $max: "$price.rate",
                  },
                },
              },
            ])
            .toArray();

          const typeOfPlace = await categoriesCollection
            .find({ $and: [searchQuery, typeQuery] })
            .toArray();
          return res.send({ typeOfPlace, findMinMaxPrice });
        }
        const typeOfPlace = await categoriesCollection.find().toArray();
        res.send(typeOfPlace);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // on top search - resion, date, and guests
    app.get("/api/search", async (req, res) => {
      const param = req.query;
      const region = param.region;
      const checkIn = Number(param?.checkIn?.split(" ")[1]);
      const checkOut = Number(param?.checkOut?.split(" ")[1]);
      const guests = param.guests;

      const adult = parseInt(guests?.adult);
      const children = parseInt(guests?.children);
      const infants = parseInt(guests?.infants);
      const pets = parseInt(guests?.pets);

      const query = {};

      if (region !== "I'm flexible") {
        query.region = region;
      }

      if (checkIn) {
        query.checkIn = { $gte: checkIn };
      }

      if (checkOut) {
        query.checkOut = { $gte: checkOut };
      }

      if (guests && adult) {
        query.adult = { $gte: adult };
      }

      if (guests && children) {
        query.children = { $gte: children };
      }

      if (guests && infants) {
        query.infants = { $gte: infants };
      }

      if (guests && pets) {
        query.pets = { $gte: pets };
      }

      const result = await categoriesCollection.find(query).toArray();

      res.send(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is listening on ${port}`);
});
