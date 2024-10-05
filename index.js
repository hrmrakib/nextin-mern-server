const express = require("express");
const cors = require("cors");
const app = express();
// require("dotenv").config();
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
//     app.js

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// const uri = "mongodb+srv://portfolio-app:<db_password>@portfoliocluster.wjb6ygv.mongodb.net/?retryWrites=true&w=majority&appName=portfolioCluster";
const uri = "mongodb://localhost:27017";

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

    // place
    app.get("/api/type-of-place", async (req, res) => {
      try {
        const param = req.query;

        console.log("param: ", param.type);
        const searchQuery = { category: param.searchQuery };
        const typeQuery = { type: param.type };

        console.log(searchQuery, typeQuery);

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
