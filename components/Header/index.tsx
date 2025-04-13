import { Loader } from "react-feather"
import { Gem } from "lucide-react"

const Header = () => {
    return (
        <nav className="flex container mx-auto justify-between items-center mb-4">
            <div className="flex items-center"> 
                <div className="ml-3 flex flex-col">
                    <span className="text-white text-2xl font-bold">SuiSynth</span>
                    <div className="h-0.5 w-24 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-400 rounded-full mt-0.5"></div>
                </div>
            </div>

            <div className="hidden md:flex space-x-[70px] text-gray-300">
                <a href="#features" className="hover:text-white transition-colors">
                    Dashboard
                </a>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                    Trade
                </a>
                <a href="#tokenomics" className="hover:text-white transition-colors">
                    Markets
                </a> 
                {/* <a href="#roadmap" className="hover:text-white transition-colors">Roadmap</a> */}
            </div>

            <button className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all">
                Dashboard
            </button>
        </nav>
    )
}

export default Header