const mongoose = require('mongoose');
const Quiz = require('../models/Quiz.js'); // Correctly import Quiz model

//create quiz
const createquiz =  async (req, res) => {
    const { question, options, correctAnswer } = req.body; // Destructure to make it clearer

    // Check if all required fields are provided
    if (!question || !options || !correctAnswer) {
        return res.status(400).json({ success: false, message: "Please provide all fields" });
    }
    try {
        const existingQuiz = await Quiz.findOne({ question });   // Check if the question already exists in the database
        if (existingQuiz) {
            return res.status(400).json({ success: false, message: "question already exists" });
        }
        const newQuiz = new Quiz({ question, options, correctAnswer });   // If email does not exist, create a new question
        await newQuiz.save();
        res.status(201).json({ success: true, data: newQuiz });      // Return success response with the new question

    } catch (error) {
        console.error("Error in creating quiz:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


// Get all quizzes
const getquiz = async (req, res) => {
    try {
        const quizzes = await Quiz.find({});  // Corrected model name to "Quiz"
        res.status(200).json({
            success: true,
            data: quizzes
        });
    } catch (error) {
        console.error('Error fetching quizzes:', error);  // Log the error
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message  // Send the error message in the response
        });
    }
};



// Update quiz
const updatequiz = async (req, res) => {
    const { id } = req.params;
    const quizData = req.body;

    // Check if the ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({
            success: false,
            message: "Invalid quiz ID"
        });
    }

    try {
        // Update the quiz by ID
        const updatedQuiz = await Quiz.findByIdAndUpdate(id, quizData, { new: true });

        // Check if the quiz was found and updated
        if (!updatedQuiz) {
            return res.status(404).json({
                success: false,
                message: "Quiz not found"
            });
        }

        // Respond with the updated quiz
        res.status(200).json({
            success: true,
            message: "Updated successfully!",
            data: updatedQuiz
        });

    } catch (error) {
        console.error('Error updating quiz:', error);  // Log the error for debugging
        res.status(500).json({
            success: false,
            message: "Failed to update quiz",
            error: error.message  // Return the error message
        });
    }
};





// Delete quiz by ID
const deletequiz = async (req, res) => {
    const { id } = req.params;

    // Check if the ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({
            success: false,
            message: "Invalid quiz ID"
        });
    }

    try {
        // Delete the quiz by ID
        const quiz = await Quiz.findByIdAndDelete(id);

        // If no quiz was found and deleted
        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: "Quiz not found"
            });
        }

        // Respond with success
        res.status(200).json({
            success: true,
            message: "Quiz deleted successfully"
        });

        console.log("Quiz deleted:", id);  // Log the quiz deletion

    } catch (error) {
        // Handle any errors
        console.error("Error deleting quiz:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message  // Include the error message in the response for debugging
        });
    }
};

module.exports = {
    createquiz,
    getquiz,
    updatequiz,
    deletequiz
};