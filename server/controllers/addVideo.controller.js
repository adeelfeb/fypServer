import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const addVideo = asyncHandler(async (req, res) => {
    const videoUrl = req.body.videoUrl;
    const userId = req.user._id; // Assuming `req.user` is populated by a middleware like `verifyJWT`
  
    if (!videoUrl) {
        throw new ApiError(400, "Please provide a valid video URL");
    }

    // Check if the video exists in the database
    let video = await Video.findOne({ videoUrl });

    if (!video) {
        // Video doesn't exist, create a new video entry
        video = new Video({ videoUrl });

        // Fetch video details (from YouTube or another source)
        await video.fetchVideoDetails();

        // Save the new video to the database
        await video.save();
    }

    // Fetch the user from the database
    const user = await User.findById(userId).populate("watchHistory");
    // console.log(user.watchHistory); 

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Check if the video is already in the user's watch history
    const alreadyInHistory = user.watchHistory.some(
        (historyItem) => historyItem.videoUrl === videoUrl
    );

    if (alreadyInHistory) {
        return res.status(200).json(
            new ApiResponse(
                201,video, "Video already in watch history",
                
            ));
    }

    // Add the video to the user's watch history
    user.watchHistory.push(video._id);
    await user.save();

    res.status(201).json(
        new ApiResponse(
            201, 
            video, 
            "Video added successfully and included in watch history",
            
        )
    );
});


const addTranscript = asyncHandler(async (req, res) => {
    const { id, english, hindi, urdu } = req.body; // Extract ID and possible transcript fields from the request body
  
    try {
      // Find the video by ID
      const video = await Video.findById(id);
  
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
  
      // Patch the transcript field
      if (english) video.transcript.english = english;
      if (hindi) video.transcript.hindi = hindi;
      if (urdu) video.transcript.urdu = urdu;
  
      // Save the updated video
      await video.save();
  
      res.status(200).json({
        message: "Transcript updated successfully",
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update transcript", error });
    }
  });
  


  const addSummary = asyncHandler(async (req, res) => {
    const { id, english, hindi, urdu } = req.body; // Extract video ID and possible summary fields from the request body

    try {
        // Find the video by ID
        const video = await Video.findById(id);

        if (!video) {
            return res.status(404).json({ message: "Video not found" });
        }

        // Patch the summary field
        if (english) video.summary.english = english;
        if (hindi) video.summary.hindi = hindi;
        if (urdu) video.summary.urdu = urdu;

        // Save the updated video
        await video.save();

        res.status(200).json({
            message: "Summary updated successfully"
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to update summary", error });
    }
});


const addQnas = asyncHandler(async (req, res) => {
    const { id, shortQuestions, mcqs } = req.body; // Extract video ID and possible Q&A fields from the request body

    try {
        // Find the video by ID
        const video = await Video.findById(id);

        if (!video) {
            return res.status(404).json({ message: "Video not found" });
        }

        // Validate and add short questions if provided
        if (shortQuestions && Array.isArray(shortQuestions)) {
            shortQuestions.forEach(({ question, answer }) => {
                if (question && answer) {
                    video.qnas.shortQuestions.push({ question, answer });
                }
            });
        }

        // Validate and add MCQs if provided
        if (mcqs && Array.isArray(mcqs)) {
            mcqs.forEach(({ question, options, correctAnswer }) => {
                if (question && options && correctAnswer && Array.isArray(options)) {
                    video.qnas.mcqs.push({ question, options, correctAnswer });
                }
            });
        }

        // Save the updated video
        await video.save();

        res.status(200).json({
            message: "Q&A updated successfully",
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to update Q&A", error });
    }
});




export { addVideo,
    addTranscript,
    addSummary,
    addQnas
 };
