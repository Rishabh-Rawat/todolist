const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");

const mongoose = require("mongoose");

mongoose.set("strictQuery", false);
mongoose.connect(
  "mongodb+srv://rishabh:04012002@cluster0.uthxsbh.mongodb.net/todolistDB?retryWrites=true&w=majority"
);

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!",
});

const item2 = new Item({
  name: "Hit + to add an item",
});

const item3 = new Item({
  name: "<-- Check this box to delete an item",
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  const query = {};
  Item.find(query, function (err, results) {
    if (results.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) console.log(err);
        else console.log("Added default items to the database.");
      });
      res.redirect("/");
    } else res.render("list", { listTitle: "Today", newListItems: results });
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const list = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (list === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: list }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + list);
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    const filter = { _id: checkedItemId };

    Item.deleteOne(filter, function (err) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/");
      }
    });
  } else {
    const filter = { name: listName };

    List.updateOne(
      filter,
      { $pull: { items: { _id: checkedItemId } } },
      function (err) {
        if (err) {
          console.log(err);
        } else {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, results) {
    if (results) {
      res.render("list", {
        listTitle: results.name,
        newListItems: results.items,
      });
    } else {
      console.log("List not present, creating one");
      console.log(results);
      const list = new List({
        name: customListName,
        items: defaultItems,
      });

      list.save();

      setTimeout(function () {
        res.redirect("/" + customListName);
      }, 100);
    }
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
