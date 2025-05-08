import React from 'react';

const HealthFactorBar = ({ healthFactor, liquidationThreshold = 120 }: any) => {
    // Calculate where the liquidation mark should be as a percentage of the bar width
    const liquidationPosition = Math.min(100, (liquidationThreshold / 2));

    // Calculate health bar width as a percentage
    const healthBarWidth = Math.min(100, (healthFactor / 2));

    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span>Health Factor</span>
                <span className={`${healthFactor >= 200 ? 'text-green-400' : healthFactor >= 150 ? 'text-blue-400' : 'text-yellow-400'}`}>
                    {healthFactor >= 200 ? 'Safe' : healthFactor >= 150 ? 'Healthy' : 'Caution'}
                </span>
            </div>
            <div className="w-full h-2 bg-slate-600 rounded-full   relative">
                {/* Health bar */}
                <div
                    className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                    style={{ width: `${healthBarWidth}%` }}
                />

                {/* Liquidation threshold marker */}
                <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500"
                    style={{ left: `50%` }}
                >
                    {/* Triangle indicator */}
                    <div
                        className="absolute -bottom-3 -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-b-red-500 border-l-transparent border-r-transparent"
                        style={{ left: '50%' }}
                    />
                </div>
            </div>
            <div className="flex justify-between text-xs">
                <span className="text-slate-500">Risky</span>
                {/* Liquidation indicator label */}
                <span className="text-red-400 text-xs" style={{ marginLeft: `160px` }}>
                    Min Collateral Ratio
                </span>
                <span className="text-slate-500">Safe</span>
            </div>
        </div>
    );
};

export default HealthFactorBar;