"use client";

import { createChart, ColorType, AreaSeries } from 'lightweight-charts';
import React, { useEffect, useRef } from 'react';

export default function CandleChart({ data, colors = {} }) {
    const chartContainerRef = useRef();

    useEffect(() => {
        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#1a1a1a', // Dark text for light theme
            },
            grid: {
                vertLines: { color: 'rgba(0, 0, 0, 0.15)', style: 0 },
                horzLines: { color: 'rgba(0, 0, 0, 0.15)', style: 0 },
            },
            rightPriceScale: {
                borderColor: 'rgba(0, 0, 0, 0.2)',
                textColor: '#1a1a1a',
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.1,
                },
            },
            leftPriceScale: {
                visible: false,
            },
            timeScale: {
                borderColor: 'rgba(0, 0, 0, 0.2)',
                textColor: '#1a1a1a',
                timeVisible: true,
                secondsVisible: false,
            },
            width: chartContainerRef.current.clientWidth,
            height: 400,
        });

        chart.timeScale().fitContent();

        // Convert data to line format and calculate trend
        let lineData = [];
        let isPositive = true;
        
        if (data && data.length > 0) {
            // Convert data to line format: { time, value }
            // Handle both { time, value } and { time, open, high, low, close } formats
            lineData = data.map(d => {
                if ('value' in d) {
                    return { time: d.time, value: d.value };
                } else if ('close' in d) {
                    return { time: d.time, value: d.close };
                } else {
                    return { time: d.time, value: d.price || d.value || 0 };
                }
            }).filter(d => d.value != null && !isNaN(d.value));
            
            // Calculate trend: compare first and last values
            if (lineData.length >= 2) {
                const firstValue = lineData[0].value;
                const lastValue = lineData[lineData.length - 1].value;
                isPositive = lastValue >= firstValue;
            }
        }

        // Determine colors based on trend
        const lineColor = isPositive ? '#22c55e' : '#ef4444'; // Green for positive, red for negative
        const topColor = isPositive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)'; // Light fill
        const bottomColor = 'rgba(0, 0, 0, 0)'; // Transparent bottom

        const newSeries = chart.addSeries(AreaSeries, {
            lineColor: lineColor,
            lineWidth: 3, // Thick, visible line
            topColor: topColor,
            bottomColor: bottomColor,
            priceLineVisible: false,
            lastValueVisible: true,
            priceFormat: {
                type: 'price',
                precision: 2,
                minMove: 0.01,
            },
        });

        if (lineData.length > 0) {
            newSeries.setData(lineData);
        }

        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [data]);

    return (
        <div
            ref={chartContainerRef}
            className="w-full h-[400px]"
        />
    );
}
