import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  LogOut,
  MessageSquareText,
  User,
  Send,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

const CHAT_STORAGE_KEY = "college-notes-chat";
const TOKEN_STORAGE_KEY = "college-notes-token";
const USER_STORAGE_KEY = "college-notes-user";
const defaultMessages = [
  {
    role: "assistant",
    content: "Upload notes on the left, then ask anything from that file.",
  },
];
const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const api = axios.create({
  baseURL: `${API_BASE_URL}/myRag/note`,
  withCredentials: true,
});

const authApi = axios.create({
  baseURL: `${API_BASE_URL}/myRag/auth`,
  withCredentials: true,
});

function getAuthToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

function setAuthHeader(config) {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

api.interceptors.request.use(setAuthHeader);
authApi.interceptors.request.use(setAuthHeader);

function getStoredUser() {
  try {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
}

function getStoredMessages() {
  try {
    const storedMessages = localStorage.getItem(CHAT_STORAGE_KEY);
    return storedMessages ? JSON.parse(storedMessages) : defaultMessages;
  } catch {
    return defaultMessages;
  }
}

function getApiMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

export default function App() {
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [authToken, setAuthToken] = useState(() => getAuthToken());
  const [user, setUser] = useState(getStoredUser);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState({
    type: "idle",
    message: "Upload a PDF note to start asking questions.",
  });
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState(getStoredMessages);
  const [isUploading, setIsUploading] = useState(false);
  const [isAsking, setIsAsking] = useState(false);

  useEffect(() => {
    if (!authToken) return;

    const loadProfile = async () => {
      try {
        const response = await authApi.get("/myProfile");
        setUser(response.data);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.data));
      } catch (error) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
        setAuthToken(null);
        setUser(null);
        toast.error(getApiMessage(error, "Please login again."));
      }
    };

    loadProfile();
  }, [authToken]);

  useEffect(() => {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const fileMeta = useMemo(() => {
    if (!selectedFile) return null;

    return {
      name: selectedFile.name,
      size: `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
      type: selectedFile.type || "PDF/document",
    };
  }, [selectedFile]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setSelectedFile(file || null);

    if (file) {
      setUploadStatus({
        type: "idle",
        message: "Ready to upload this file.",
      });
    }
  };

  const handleAuthChange = (event) => {
    const { name, value } = event.target;
    setAuthForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();

    try {
      setIsAuthLoading(true);

      if (authMode === "signup") {
        const response = await authApi.post("/signup", {
          name: authForm.name.trim(),
          email: authForm.email.trim(),
          password: authForm.password,
        });

        toast.success(response.data?.message || "Signup successful.");
        setAuthMode("login");
        setAuthForm((current) => ({ ...current, name: "", password: "" }));
        return;
      }

      const response = await authApi.post("/login", {
        email: authForm.email.trim(),
        password: authForm.password,
      });
      const token =
        typeof response.data === "string" ? response.data : response.data?.token;

      if (!token) {
        throw new Error("Login token not found in response.");
      }

      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      setAuthToken(token);
      setAuthForm({ name: "", email: "", password: "" });
      toast.success("Login successful.");
    } catch (error) {
      toast.error(getApiMessage(error, "Authentication failed."));
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus({
        type: "error",
        message: "Please select a file first.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setIsUploading(true);
      setUploadStatus({
        type: "loading",
        message: "Uploading and sending file for processing...",
      });

      const response = await api.post("/upload", formData);

      setUploadStatus({
        type: "success",
        message:
          response.data?.message ||
          "File uploaded successfully. You can ask questions now.",
      });
    } catch (error) {
      setUploadStatus({
        type: "error",
        message: getApiMessage(error, "File upload failed."),
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAsk = async (event) => {
    event.preventDefault();

    const cleanQuestion = question.trim();
    if (!cleanQuestion) return;

    const userMessage = {
      role: "user",
      content: cleanQuestion,
    };

    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setIsAsking(true);

    try {
      const response = await api.get("/getNote", {
        params: {
          question: cleanQuestion,
        },
      });

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: response.data?.answer || "No answer returned from backend.",
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: getApiMessage(error, "Could not fetch answer from backend."),
          isError: true,
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploadStatus({
      type: "idle",
      message: "Upload a PDF note to start asking questions.",
    });
  };

  const clearChat = () => {
    setMessages(defaultMessages);
    localStorage.removeItem(CHAT_STORAGE_KEY);
  };

  const handleLogout = async () => {
    try {
      await authApi.post("/logout");
      toast.success("Logout successful.");
    } catch (error) {
      toast.error(getApiMessage(error, "Logged out locally."));
    } finally {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      setAuthToken(null);
      setUser(null);
      setSelectedFile(null);
    }
  };

  const statusIcon = {
    idle: <FileText size={18} />,
    loading: <Loader2 className="spin" size={18} />,
    success: <CheckCircle2 size={18} />,
    error: <AlertCircle size={18} />,
  }[uploadStatus.type];

  if (!authToken) {
    return (
      <>
        <Toaster position="top-right" toastOptions={{ duration: 2800 }} />
        <main className="auth-shell">
          <section className="auth-panel">
            <div className="auth-copy">
              <p className="eyebrow">College Notes</p>
              <h1>{authMode === "login" ? "Welcome Back" : "Create Account"}</h1>
              <p>
                {authMode === "login"
                  ? "Login to upload your notes and ask questions from your PDFs."
                  : "Signup once, then start querying your uploaded college notes."}
              </p>
            </div>

            <form className="auth-form" onSubmit={handleAuthSubmit}>
              {authMode === "signup" && (
                <label>
                  <span>Name</span>
                  <input
                    name="name"
                    value={authForm.name}
                    onChange={handleAuthChange}
                    placeholder="Enter your name"
                    required
                  />
                </label>
              )}

              <label>
                <span>Email</span>
                <input
                  name="email"
                  type="email"
                  value={authForm.email}
                  onChange={handleAuthChange}
                  placeholder="Enter your email"
                  required
                />
              </label>

              <label>
                <span>Password</span>
                <input
                  name="password"
                  type="password"
                  value={authForm.password}
                  onChange={handleAuthChange}
                  placeholder="Minimum 8 characters"
                  minLength={8}
                  required
                />
              </label>

              <button className="primary-button" type="submit" disabled={isAuthLoading}>
                {isAuthLoading && <Loader2 className="spin" size={18} />}
                {authMode === "login" ? "Login" : "Signup"}
              </button>

              <button
                className="auth-switch"
                type="button"
                onClick={() =>
                  setAuthMode((current) =>
                    current === "login" ? "signup" : "login"
                  )
                }
              >
                {authMode === "login"
                  ? "Create a new account"
                  : "Already have an account? Login"}
              </button>
            </form>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 2800 }} />
      <main className="app-shell">
        <div className="profile-area">
          <button className="profile-button" type="button">
            <span className="avatar">
              <User size={18} />
            </span>
            {user?.name || user?.username || "Profile"}
          </button>
          <div className="profile-card">
            <strong>{user?.name || user?.username || "User"}</strong>
            <span>{user?.email || "Profile details loading..."}</span>
            {user?._id && <small>ID: {user._id}</small>}
            <button type="button" onClick={handleLogout}>
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
        <section className="workspace">
        <aside className="upload-panel" aria-label="File upload">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">College Notes</p>
              <h1>Ask Your PDF</h1>
            </div>
            <FileText size={28} aria-hidden="true" />
          </div>

          <label className="drop-zone">
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
            />
            <UploadCloud size={42} aria-hidden="true" />
            <span>Choose notes file</span>
            <small>PDF upload supported by backend</small>
          </label>

          {fileMeta && (
            <div className="file-preview">
              <div className="file-icon">
                <FileText size={22} aria-hidden="true" />
              </div>
              <div>
                <strong>{fileMeta.name}</strong>
                <span>
                  {fileMeta.size} . {fileMeta.type}
                </span>
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={clearFile}
                aria-label="Remove selected file"
                title="Remove selected file"
              >
                <X size={18} />
              </button>
            </div>
          )}

          <button
            className="primary-button"
            type="button"
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="spin" size={18} />
            ) : (
              <UploadCloud size={18} />
            )}
            Upload File
          </button>

          <div className={`status ${uploadStatus.type}`}>
            {statusIcon}
            <span>{uploadStatus.message}</span>
          </div>
        </aside>

        <section className="chat-panel" aria-label="Ask questions">
          <div className="chat-header">
            <div>
              <p className="eyebrow">Query Notes</p>
              <h2>Ask questions from uploaded file</h2>
            </div>
            <div className="chat-actions">
              <button
                className="clear-chat-button"
                type="button"
                onClick={clearChat}
                title="Clear all chat"
              >
                <Trash2 size={17} />
                Clear chat
              </button>
              <MessageSquareText size={26} aria-hidden="true" />
            </div>
          </div>

          <div className="messages" aria-live="polite">
            {messages.map((message, index) => (
              <div
                className={`message ${message.role} ${
                  message.isError ? "error-message" : ""
                }`}
                key={`${message.role}-${index}`}
              >
                <span>{message.role === "user" ? "You" : "Assistant"}</span>
                <p>{message.content}</p>
              </div>
            ))}

            {isAsking && (
              <div className="message assistant">
                <span>Assistant</span>
                <p className="thinking">
                  <Loader2 className="spin" size={16} />
                  Finding answer from notes...
                </p>
              </div>
            )}
          </div>

          <form className="question-box" onSubmit={handleAsk}>
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Type your question here..."
              rows={2}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleAsk(event);
                }
              }}
            />
            <button
              className="send-button"
              type="submit"
              disabled={isAsking || !question.trim()}
              aria-label="Ask question"
              title="Ask question"
            >
              {isAsking ? <Loader2 className="spin" size={20} /> : <Send size={20} />}
            </button>
          </form>
        </section>
        </section>
      </main>
    </>
  );
}
