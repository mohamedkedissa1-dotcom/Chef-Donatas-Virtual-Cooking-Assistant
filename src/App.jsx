// App.jsx
import { useState, useRef, useEffect, Suspense, useCallback } from "react";
import OpenAI from "openai";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, useAnimations, Html, Text, useFBX } from "@react-three/drei";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AddRecipePage from "./pages/AddRecipePage.jsx";
import * as THREE from "three";
import { fetchRecipes } from "./recipes.jsx";
import "./App.css";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

// 🎭 Character
function Character({ isTalking, onLoaded }) {
  const gltf = useGLTF("/character/donatas.glb");
  const outfitGltf = useGLTF("/character/apron.glb"); // 🧥 outfit as separate object
  // const tshirt = useGLTF("/character/clothes/tshirt.glb");
  const pants = useGLTF("/character/clothes/pants.glb");
  const { actions } = useAnimations(gltf.animations, gltf.scene);

  useEffect(() => {
    if (!gltf) return;

    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        if (child.name === "Boxers") {
          // ❌ Hide the Boxers mesh
          if (child.name === "Boxers") {
            child.visible = false;
          }

        }
      };
    })
  }, [gltf]);


  // 🎬 Handle animations
  useEffect(() => {
    if (!actions) return;
    const actionName = Object.keys(actions).find(name =>
      name.includes("CC3_Base_Plus")
    );
    if (!actionName) return;
    const action = actions[actionName];

    if (isTalking) {
      action.reset();
      action.play();
      action.paused = false;  // let it move
    } else {
      action.reset();
      action.play();
      action.paused = true;
      action.time = 0;
    }
  }, [isTalking, actions]);

  // 👀 Keep eye modification effect
  useEffect(() => {
    const createEyeTexture = () => {
      const size = 256;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, size, size);
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 6, 0, Math.PI * 2);
      ctx.fillStyle = "black";
      ctx.fill();
      return new THREE.CanvasTexture(canvas);
    };

    const eyeTexture = createEyeTexture();

    gltf.scene.traverse((child) => {
      if (
        child.isMesh &&
        (child.name.includes("CC_Base_Eye_2") || child.name.includes("CC_Base_Eye_4"))
      ) {
        child.material = new THREE.MeshStandardMaterial({
          map: eyeTexture,
          roughness: 1,
          metalness: 0,
        });
        child.material.needsUpdate = true;
      }
    });
  }, [gltf]);

  // 🔔 Keep your onLoaded intact
  useEffect(() => {
    if (onLoaded) onLoaded();
  }, [onLoaded]);

  useEffect(() => {
    outfitGltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: "white",
          roughness: 0.9,
          metalness: 0.1,
        });
        child.material.needsUpdate = true;
      }
    });
  }, [outfitGltf]);

  // 📐 Base character position
  gltf.scene.rotation.y = Math.PI * 2;
  gltf.scene.scale.set(1.7, 1.7, 1.7);
  gltf.scene.position.set(0, -1.9, 0);

  // 📐 Outfit manual adjustments
  outfitGltf.scene.scale.set(2, 1.8, 1.3);
  outfitGltf.scene.position.set(0, -1.9, 0.03);
  outfitGltf.scene.rotation.y = Math.PI * 2;

  // tshirt.scene.scale.set(5, 5.5, 8);
  // tshirt.scene.rotation.y = Math.PI * 2;
  // tshirt.scene.position.set(0, 0.27, 0.01);

  pants.scene.scale.set(1.7, 1.7, 1.7);
  pants.scene.rotation.y = Math.PI * 2;
  pants.scene.position.set(0, -1.9, 0.02);

  return (
    <>
      <primitive object={gltf.scene} />
      <primitive object={outfitGltf.scene} />
      {/* 🧵 Add text on apron */}
      <Text
        position={[0.09, 0.65, 0.9]} // tweak X, Y, Z so it sits on apron
        rotation={[0, 0, 0]}      // keep flat against apron
        fontSize={0.02}
        color="black"
        anchorX="center"
        anchorY="middle"
        depth={0.05}   // makes text pop out like 3D letters
        bevelEnabled   // optional rounded edges
        bevelSize={0.005}
        bevelThickness={0.01}
      >
        Chef Donatas
      </Text>
      {/* <primitive object={tshirt.scene} />           T-shirt */}
      <primitive object={pants.scene} />           {/* Pants */}
    </>
  );
}



function App() {
  const [transcript, setTranscript] = useState("");
  const [chefReply, setChefReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [started, setStarted] = useState(false);
  const [stillTalking, setStillTalking] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const { width, height } = useWindowSize();
  const [randomNumber, setRandomNumber] = useState();
  const backgrounds = ["/backgrounds/1.jpg", "/backgrounds/2.jpg", "/backgrounds/3.jpg", "/backgrounds/4.jpg"];
  const [characterLoaded, setCharacterLoaded] = useState(false);
  const [showGuidance, setShowGuidance] = useState(false);
  const [actionHappened, setActionHappened] = useState(false);

  const recognitionRef = useRef(null);
  const messagesRef = useRef([
    {
      role: "system",
      content: `You are Chef Donatas, an enthusiastic professional cooking assistant. Follow these rules strictly:
  1. Keep responses under 80 words maximum
  2. Use exactly 1-2 short paragraphs only
  3. NEVER get cut off mid-sentence - if reaching limit, end properly
  4. Be passionate but concise
  5. Only answer cooking-related questions
  6. For recipes: give 3-4 key steps maximum
  7. For techniques: focus on 2-3 most important tips
  8. Always complete your thoughts before ending`
    }
  ]);
  const lastTranscriptRef = useRef("");
  const isListening = useRef(false);
  const isStopping = useRef(false);
  const speakingQueueCount = useRef(0);
  const utterancesRef = useRef([]);
  const stopRequestedRef = useRef(false);
  const lastButtonClickRef = useRef(0);
  const isProcessingRef = useRef(false);

  const [messages, setMessages] = useState([
    {
      role: "system",
      content: `You are Chef Donatas, an enthusiastic professional cooking assistant. Follow these rules strictly:
  1. Keep responses under 80 words maximum
  2. Use exactly 1-2 short paragraphs only
  3. NEVER get cut off mid-sentence - if reaching limit, end properly
  4. Be passionate but concise
  5. Only answer cooking-related questions
  6. For recipes: give 3-4 key steps maximum
  7. For techniques: focus on 2-3 most important tips
  8. Always complete your thoughts before ending`
    }
  ]);

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  // check if the user does any actions
  const handleUserAction = useCallback(() => {
    setActionHappened(true);
  }, []);

  useEffect(() => {
    // Reset actionHappened after action performed
    if (actionHappened) {
      const timer = setTimeout(() => {
        setActionHappened(false); // reset to wait for next action
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearTimeout(timer);
    }
  }, [actionHappened]);

  useEffect(() => {
    // Start a 5-minute timer to check if actionHappened stays false
    if (!actionHappened) {
      const timeout = setTimeout(() => {
        setStarted(false) // refresh the page after 5 mins of no action
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearTimeout(timeout);
    }
  }, [actionHappened]);


  // 🌐 Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    setIsOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    console.log("Messages updated:", messages);
  }, [messages]);

  // ❌ Cancel speech on unload
  useEffect(() => {
    const handleBeforeUnload = () => window.speechSynthesis.cancel();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // 🔊 Voice Output
  const speakText = (text, onFinish) => {
    if (stopRequestedRef.current) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.pitch = 1.2;

    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.name === "Google UK English Male") || voices[0];
      if (voice) utterance.voice = voice;
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        setVoice();
        window.speechSynthesis.speak(utterance);
      };
    } else {
      setVoice();
      window.speechSynthesis.speak(utterance);
    }

    utterancesRef.current.push(utterance);
    speakingQueueCount.current += 1;
    setStillTalking(true);

    utterance.onstart = () => {
      isStopping.current = true;
      if (recognitionRef.current && isListening.current) {
        recognitionRef.current.stop();
      }
    };

    utterance.onend = () => {
      speakingQueueCount.current -= 1;
      utterancesRef.current = utterancesRef.current.filter(u => u !== utterance);
      if (speakingQueueCount.current === 0) {
        setStillTalking(false);
        isStopping.current = false;
        setTranscript("");
        setChefReply("");
        if (onFinish) onFinish();
        setTimeout(() => {
          if (recognitionRef.current && !isListening.current) {
            safeStartRecognition(recognitionRef.current);
          }
        }, 500);
      }
    };
  };

  const stopAllSpeech = () => {
    stopRequestedRef.current = true;
    window.speechSynthesis.cancel();
    speakingQueueCount.current = 0;
    utterancesRef.current = [];
    setStillTalking(false);
    isStopping.current = false;
  };

  // 🎤 Speech Recognition
  const startRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in your browser.");
      return;
    }
    let recognition = recognitionRef.current;
    if (!recognition) {
      recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.continuous = true;
      recognition.onresult = async (event) => {
        stopRequestedRef.current = false;
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript.trim();
          }
        }
        if (finalTranscript && finalTranscript !== lastTranscriptRef.current) {
          lastTranscriptRef.current = finalTranscript;
          setTranscript(finalTranscript);
          await askChef(finalTranscript);
          handleUserAction();
        }
      };
      recognition.onerror = (event) => {
        isListening.current = false;
        setTimeout(() => {
          if (!stillTalking && !isStopping.current && !isListening.current) {
            safeStartRecognition(recognition);
          }
        }, 500);
      };
      recognition.onstart = () => {
        isListening.current = true;
      };
      recognition.onend = () => {
        isListening.current = false;
        if (!stillTalking && !isStopping.current) {
          setTimeout(() => {
            if (!isListening.current) {
              safeStartRecognition(recognition);
            }
          }, 300);
        }
      };
      recognitionRef.current = recognition;
    }
    safeStartRecognition(recognition);
  };

  const safeStartRecognition = (() => {
    let isStarting = false;
    return (recognition) => {
      if (!recognition) return;
      if (isListening.current || isStarting) {
        // Already running or starting, do nothing
        return;
      }
      try {
        isStarting = true;
        recognition.start();
        isListening.current = true;
        setTimeout(() => {
          isStarting = false;
        }, 1000); // reset after 1s to prevent rapid calls
      } catch (err) {
        console.warn("Recognition already started, ignoring:", err.message);
        isStarting = false;
      }
    };
  })();


  const handleStart = () => {
    generateRandom();
    setStarted(true);
    handleUserAction();
  };

  useEffect(() => {
    if (started && characterLoaded && navigator.onLine) {
      const hiMessage = "Hi, I'm Donatas, your cook assistant, how can I help you today?";
      setChefReply(hiMessage);
      speakText(hiMessage, startRecognition);
    }
  }, [characterLoaded, started]);


  let lastCall = 0;
  const MIN_DELAY = 4000; // 4s between requests




  // Update the ref whenever messages change
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // 🧑‍🍳 Ask Chef - SIMPLE AND CLEAN
  const askChef = async (userMessage) => {
    // ✅ Prevent if already processing
    // if (isProcessingRef.current) {
    //   console.log("Already processing a request");
    //   return;
    // }

    isProcessingRef.current = true;
    setLoading(true);

    const now = Date.now();
    if (now - lastCall < MIN_DELAY) {
      console.warn("Skipping request: too soon");
      setLoading(false);
      return;
    }
    lastCall = now;

    const modelName = "meta-llama/llama-3-8b-instruct";

    // 🍲 Recipe shortcut (keep your existing code)
    if (userMessage.toLowerCase().includes("recipe for")) {
      const match = userMessage.toLowerCase().match(/for\s+(.+)/);
      const keyword = match ? match[1].trim() : userMessage.trim();
      const recipes = await fetchRecipes(keyword);

      if (recipes.length > 0) {
        const reply = `Here's a recipe for ${recipes[0].recipe_name}:\n\nIngredients:\n${recipes[0].ingredients_column}\n\nInstructions:\n${recipes[0].description}`;
        setChefReply(reply);
        setMessages(prev => [...prev, { role: "user", content: userMessage }, { role: "assistant", content: reply }]);
        if (!stopRequestedRef.current) speakText(reply, startRecognition);
        setLoading(false);
        return;
      }
    }

    try {
      // ✅ Get latest messages from ref (no timing issues)
      const currentMessages = messagesRef.current;
      const updatedWithUser = [...currentMessages, { role: "user", content: userMessage }];

      // ✅ Call AI with full conversation including new user message
      const chefReply = await fetchFromAI(updatedWithUser, modelName);
      setChefReply(chefReply);
      // ✅ Single state update with both messages
      const finalMessages = [...updatedWithUser, { role: "assistant", content: chefReply }];
      setMessages(finalMessages);

      speakText(chefReply, startRecognition);

    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFromAI = async (updatedMessages, modelName) => {
    try {
      for (let i = 0; i <= MAX_RETRIES; i++) {
        setRetryAttempt(i);
        if (i > 0) {
          const delay = BASE_DELAY_MS * Math.pow(2, i - 1);
          console.log(`Chef is busy! Retrying in ${delay / 1000} seconds...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
        try {
          const result = await openai.chat.completions.create({
            model: modelName,
            messages: updatedMessages, // ✅ full conversation always passed
            max_tokens: 300, // ✅ Limit response length
            temperature: 0.7, // ✅ Control randomness
          });

          let chefReply =
            result.choices?.[0]?.message?.content || "Chef is stumped. Try asking again!";
          // ✅ Ensure response is complete (not cut off)
          chefReply = ensureCompleteResponse(chefReply);
          setLoading(false);
          setRetryAttempt(0);
          return chefReply;
        } catch (err) {
          if (err.status === 429) {
            const delay = 1000 * Math.pow(2, i); // exponential backoff
            console.warn(`Rate limited, retrying in ${delay / 1000}s...`);
            await new Promise((res) => setTimeout(res, delay));
            continue;
          }
          if (
            i < MAX_RETRIES &&
            (err.message.includes("fetch") ||
              err.message.includes("overloaded") ||
              err.message.includes("Rate Limit"))
          ) {
            continue;
          } else {
            throw err;
          }
        }
      }
      console.log("Error talking to chef: All retry attempts failed.");
    } catch (finalErr) {
      console.log(`Error talking to chef: ${finalErr.message}`);
    } finally {
      setLoading(false);
      setRetryAttempt(0);
    }
  };


  const ensureCompleteResponse = (text) => {
    // Check for common cut-off patterns
    const cutOffPatterns = [
      /\.\.\.$/,
      /\.\.$/,
      /,$/,
      /[^.!?]$/, // Ends without punctuation
      /\b(and|or|but|then|next|finally)\s*$/i
    ];

    const isCutOff = cutOffPatterns.some(pattern => pattern.test(text));

    if (isCutOff) {
      // For cut-off responses, either truncate or add ellipsis
      // Find the last complete sentence
      const lastSentenceEnd = text.search(/[.!?](?=\s*[A-Z]|$)/);
      if (lastSentenceEnd !== -1) {
        return text.substring(0, lastSentenceEnd + 1);
      }
      return text + "..."; // Or handle differently
    }

    return text;
  };


  const handleNewSession = () => {
    // ✅ Prevent spamming - minimum 2 seconds between clicks
    const now = Date.now();
    if (now - lastButtonClickRef.current < 2000) {
      console.log("Button spamming prevented");
      return;
    }
    lastButtonClickRef.current = now;

    // ✅ Prevent if already processing
    if (isProcessingRef.current) {
      console.log("Already processing, please wait");
      return;
    }

    isProcessingRef.current = true;

    stopAllSpeech();
    stopRequestedRef.current = false;
    lastTranscriptRef.current = "";
    setTranscript("");
    setChefReply("");
    setRetryAttempt(0);
    setMessages([messages[0]]);
    generateRandom();
    handleUserAction();

    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    startRecognition();

    if (navigator.onLine) {
      const newSessionText = "Let's start a new session! What's on your mind?";
      setChefReply(newSessionText);
      speakText(newSessionText, () => {
        isProcessingRef.current = false; // ✅ Reset when speech finishes
      });
    } else {
      isProcessingRef.current = false;
    }
  };

  const stopResponse = () => {
    // ✅ Prevent spamming - minimum 1 second between clicks
    const now = Date.now();
    if (now - lastButtonClickRef.current < 1000) {
      console.log("Button spamming prevented");
      return;
    }
    lastButtonClickRef.current = now;

    // ✅ Prevent if already stopped or not processing
    if (!isProcessingRef.current && !stillTalking) {
      console.log("Nothing to stop");
      return;
    }

    stopAllSpeech();
    setTranscript("");
    setChefReply("");
    handleUserAction();

    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    // ✅ Add a small delay before restarting recognition
    setTimeout(() => {
      startRecognition();
      isProcessingRef.current = false;
    }, 500);
  };

  function useWindowSize() {
    const [windowSize, setWindowSize] = useState({
      width: window.innerWidth,
      height: window.innerHeight,
    });
    useEffect(() => {
      const handleResize = () => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);
    return windowSize;
  }

  const generateRandom = () => {
    let value;
    do {
      value = Math.floor(Math.random() * 4) + 1;
    } while (value === randomNumber);
    setRandomNumber(value);
  };

  if (!started) {
    return (
      <div className="homepage-buttons h-screen flex flex-col items-center justify-center bg-orange-50 overflow-hidden gap-4">
        <button
          onClick={handleStart}
          className="new-session px-8 py-4 bg-orange-500 text-black font-bold rounded-xl shadow-lg hover:bg-orange-600 transition"
        >
          🍳 Start Cooking Assistant
        </button>
        <a
          href="/add-recipe"
          className="new-session px-8 py-4 bg-green-500 text-white font-bold rounded-xl shadow-lg hover:bg-green-600 transition"
        >
          ➕ Add or Remove Recipe
        </a>
        <button
          onClick={() => setShowGuidance(!showGuidance)}
          className="guidance-button"
          aria-label="User Guidance"
        >
          ❔
        </button>
        {showGuidance && (
          <div className="guidance-panel">
            <h2>📖 User Guidance</h2>
            <ul>
              <li>🍳 Ask me only about cooking and recipes.</li>
              <li>🗣 Keep your questions short and clear.</li>
              <li>❌ If your question isn’t about cooking, I’ll say so.</li>
              <li>📌 When asking for a recipe, use the words <strong>"recipe for"</strong>.</li>
              <li>💬 The conversation with the app is continuous; you can keep asking follow-up questions.</li>
              <li>🔁 Use the "New Session" button to restart anytime.</li>
              <li>🛑 Use the "Stop Speech" button to cancel my response.</li>
            </ul>
            <button onClick={() => setShowGuidance(false)} className="close-button">
              Close
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="h-screen flex items-center justify-center bg-orange-50 overflow-hidden">
        <p className="px-8 py-4 text-black font-bold">
          You Are Currently Offline!
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col justify-between items-center overflow-hidden canvas-container">
      {/* 3D Character */}
      <div className="mb-[20px] flex justify-center">
        <div className="shadow-lg flex items-center justify-center overflow-hidden "
          style={{
            width: width,
            height: height,
            backgroundImage: randomNumber ? `url(${backgrounds[randomNumber - 1]})` : `url('/backgrounds/1.jpg')`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center center",
            backgroundSize: "cover",
          }}>
          <div className="canvas-wrapper">
            <Canvas
              camera={{ position: [0, 1.2, 3], fov: 50 }}
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0 }}
            >
              <ambientLight intensity={1.2} />
              <directionalLight intensity={1.5} position={[2, 5, 2]} />
              <Suspense fallback={<Html center><p className="text-white text-2xl">Loading character...</p></Html>}>
                <Character
                  isTalking={stillTalking}
                  onLoaded={() => {
                    setCharacterLoaded(true);
                  }}
                />
              </Suspense>
              <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
            </Canvas>
          </div>
        </div>
      </div>

      {/* Transcript + Status */}
      <div className="fixed bottom-[15.5%] left-0 w-full flex flex-col items-center text-center px-4 z-50">
        {transcript && (
          <p className="text-2xl text-white font-semibold mt-2">
            <strong>You asked:</strong>{" "}
            <span className="italic">"{transcript}"</span>
          </p>
        )}
        {chefReply && (
          <p className="text-2xl text-white font-semibold mt-2">
            <strong>Donatas:</strong>{" "}
            <span className="italic">"{chefReply}"</span>
          </p>
        )}
        {loading && (
          <p className="text-xl text-white italic mt-2">
            {retryAttempt === 0
              ? "Chef is cooking up a response..."
              : `Chef is busy! Retrying... (Attempt ${retryAttempt + 1}/${MAX_RETRIES + 1})`}
          </p>
        )}
      </div>

      {/* Buttons */}
      <div className="homepage-buttons fixed bottom-0 left-0 w-full flex justify-center gap-4 p-4 bg-orange-50 button-group z-50">
        <button
          onClick={handleNewSession}
          className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl shadow hover:bg-orange-600 transition new-session"
        >
          🔁 New Session
        </button>
        <button
          onClick={stopResponse}
          className="px-6 py-3 bg-red-500 text-white font-semibold rounded-xl shadow hover:bg-red-600 transition stop-speech"
        >
          🛑 Stop Speech
        </button>
      </div>
    </div>
  );
}

export default function WrappedApp() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/add-recipe" element={<AddRecipePage />} />
      </Routes>
    </Router>
  );
}
