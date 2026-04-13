import { useState } from "react";
import { Scale } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { api, setAuthToken } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import authBg from "../assets/auth-bg.jpg";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const data = await api.login(email, password);
            // Store token first so getMe() can use it
            setAuthToken(data.access_token);
            // Fetch profile to populate auth context
            const userData = await api.getMe();
            login(data.access_token, { email: userData.email, name: userData.name });
            navigate("/");
        } catch (err: any) {
            setError(err.message || "Failed to login. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="min-h-screen pt-20 flex items-center justify-center bg-[#2952C2] px-4">
            <div className="w-full max-w-3xl">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="grid md:grid-cols-2">

                        {/* Left Image */}
                        <div className="hidden md:block bg-slate-50">
                            <img
                                src={authBg}
                                className="h-full w-full object-contain p-8"
                                alt="login"
                            />
                        </div>

                        {/* Right Form */}
                        <div className="flex items-center">
                            <div className="w-full p-8 md:p-10">

                                {/* Logo */}
                                <div className="flex items-center mb-4">
                                    <Scale size={28} className="text-orange-500 mr-3" />
                                    <span className="text-2xl font-bold">LegalGuide AI</span>
                                </div>

                                <h5 className="text-lg font-normal mb-6 tracking-wide">
                                    Sign into your account
                                </h5>

                                {error && (
                                    <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-md">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleLogin} className="space-y-4">

                                    {/* Email */}
                                    <div>
                                        <input
                                            type="email"
                                            placeholder="Email address"
                                            className="w-full px-4 py-3 border rounded-md text-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <input
                                            type="password"
                                            placeholder="Password"
                                            className="w-full px-4 py-3 border rounded-md text-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>

                                    {/* Button */}
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-black text-white py-3 rounded-md text-lg hover:bg-gray-800 transition disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {loading ? "Logging in..." : "Login"}
                                    </button>
                                </form>

                                {/* Links */}
                                <div className="mt-4 space-y-2 text-sm">
                                    <button className="text-gray-500 hover:underline">
                                        Forgot password?
                                    </button>

                                    <p className="text-gray-600">
                                        Don't have an account?{" "}
                                        <Link
                                            to="/signup"
                                            className="text-blue-600 hover:underline"
                                        >
                                            Register here
                                        </Link>
                                    </p>

                                    <div className="flex gap-4 text-gray-400 text-xs mt-4">
                                        <button type="button">Terms of use</button>
                                        <button type="button">Privacy policy</button>
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}