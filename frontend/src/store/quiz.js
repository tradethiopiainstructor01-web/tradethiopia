import { create } from "zustand";

export const useQuizStore = create((set) => ({
    quizs: [],
    loading: false,
    error: null,
    setQuizs: (quizs) => set({ quizs }),

    fetchQuizs: async () => {
        try {
            const res = await fetch("${import.meta.env.VITE_API_URL}/api/quiz");
            if (!res.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await res.json();
            set({ quizs: data.data });
        } catch (error) {
            console.error("Failed to fetch quizs:", error);
            set({ error: "Failed to load quizs. Please try again later." });
        }
    },

    deletequiz: async (qid) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/quiz/${qid}`, {
                method: "DELETE",
            });
    
            const data = await res.json();
            if (!data.success) {
                return { success: false, message: data.message };
            }
    
            // Optimistically remove the quiz from the local state and also refresh the UI
            set(state => ({
                quizs: state.quizs.filter(quiz => quiz._id !== qid),
            }));
            return { success: true, message: "Quiz deleted successfully!" };
    
        } catch (error) {
            console.error("Error deleting quiz:", error);
            return { success: false, message: "Failed to delete quiz. Please try again later." };
        }
    },

    updateQuiz: async (qid, updatedQuiz) => {
 
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/Quiz/${qid}`, {
                method: "PUT",
                headers: {
                    "content-Type": "application/json",
                },
                body: JSON.stringify(updatedQuiz),
            });

            const data = await res.json();
            if (!data.success) return { success:false, message: data.message};
            set((state) => ({
                quizs: state.quizs.map((quiz) => (quiz._id === qid ? data.data : quiz)),
            }));
    
    },
    
    
}));
