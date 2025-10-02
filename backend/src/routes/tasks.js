const express = require("express");
const { body, validationResult } = require("express-validator");
const Task = require("../models/Task");
const auth = require("../middleware/auth");

const router = express.Router();

// Get all tasks of logged-in user
router.get("/", auth, async (req,res)=>{
  try{
    const tasks = await Task.find({ user: req.user.id });
    res.json(tasks);
  } catch(err){ res.status(500).send("Server error"); }
});

// Create task
router.post("/", auth, body("title").notEmpty(), async (req,res)=>{
  const errors = validationResult(req);
  if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try{
    const task = new Task({ title: req.body.title, user: req.user.id });
    await task.save();
    res.json(task);
  } catch(err){ res.status(500).send("Server error"); }
});

// Update task
router.put("/:id", auth, async (req,res)=>{
  const { title, completed } = req.body;
  const updateData = {};
  if(title !== undefined) updateData.title = title;
  if(completed !== undefined) updateData.completed = completed;

  try{
    let task = await Task.findById(req.params.id);
    if(!task) return res.status(404).json({ msg: "Task not found" });
    if(task.user.toString() !== req.user.id) return res.status(401).json({ msg: "Not authorized" });

    task = await Task.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });
    res.json(task);
  } catch(err){ res.status(500).send("Server error"); }
});

// Delete task
router.delete("/:id", auth, async (req,res)=>{
  try{
    let task = await Task.findById(req.params.id);
    if(!task) return res.status(404).json({ msg: "Task not found" });
    if(task.user.toString() !== req.user.id) return res.status(401).json({ msg: "Not authorized" });

    await Task.findByIdAndRemove(req.params.id);
    res.json({ msg: "Task removed" });
  } catch(err){ res.status(500).send("Server error"); }
});

module.exports = router;
