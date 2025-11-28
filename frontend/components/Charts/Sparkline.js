"use client";

import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';
import React, { useEffect, useRef } from 'react';

export default function Sparkline({ data, isPositive = true }) {
    const chartContainerRef = useRef();

    useEffect(() => {
        if (!chartContainerRef.current || !data || data.length === 0) {
            return;
        }

        const handleResize = () => {
            if (chartContainerRef.current && chart) {
                chart.applyOptions({ 
                    width: chartContainerRef.current.clientWidth || 160,
                    height: chartContainerRef.current.clientHeight || 64,
                });
            }
        };

        const width = chartContainerRef.current.clientWidth || 160;
        const height = chartContainerRef.current.clientHeight || 64;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Transparent },
                textColor: 'transparent',
            },
            grid: {
                vertLines: { visible: false },
                horzLines: { visible: false },
            },
            width: width,
            height: height,
            rightPriceScale: {
                visible: false,
            },
            leftPriceScale: {
                visible: false,
            },
            timeScale: {
                visible: false,
            },
            crosshair: {
                mode: 1, // Normal crosshair mode for tooltip
                vertLine: {
                    visible: true,
                    width: 1,
                    color: 'rgba(0, 0, 0, 0.2)',
                    style: 0, // Solid line
                },
                horzLine: {
                    visible: true,
                    width: 1,
                    color: 'rgba(0, 0, 0, 0.2)',
                    style: 0, // Solid line
                },
            },
            handleScroll: false,
            handleScale: false,
        });

        chart.timeScale().fitContent();

        const series = chart.addSeries(CandlestickSeries, {
            upColor: isPositive ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)',
            downColor: isPositive ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)',
            borderVisible: true,
            borderUpColor: isPositive ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)',
            borderDownColor: isPositive ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)',
            wickUpColor: 'transparent',
            wickDownColor: 'transparent',
            priceLineVisible: false,
            lastValueVisible: false,
        });

        // Create a tooltip element
        const tooltip = document.createElement('div');
        tooltip.style.cssText = `
            position: absolute;
            display: none;
            padding: 8px 12px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            border-radius: 4px;
            font-size: 12px;
            pointer-events: none;
            z-index: 1000;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        `;
        chartContainerRef.current.style.position = 'relative';
        chartContainerRef.current.appendChild(tooltip);

        // Subscribe to crosshair moves to show tooltip
        chart.subscribeCrosshairMove((param) => {
            if (param.point === undefined || !param.time || param.point.x < 0 || param.point.x > width || param.point.y < 0 || param.point.y > height) {
                tooltip.style.display = 'none';
            } else {
                const data = param.seriesData.get(series);
                if (data) {
                    const price = data.close || data.value || 0;
                    const date = new Date(param.time * 1000);
                    const timeStr = date.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    });
                    
                    tooltip.innerHTML = `
                        <div style="font-weight: 600; margin-bottom: 4px;">€${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div style="font-size: 11px; opacity: 0.8;">${timeStr}</div>
                    `;
                    tooltip.style.display = 'block';
                    
                    // Position tooltip above the cursor, but keep it within bounds
                    let leftPos = param.point.x - 40;
                    let topPos = param.point.y - 50;
                    
                    // Keep tooltip within container bounds
                    if (leftPos < 0) leftPos = 8;
                    if (leftPos + 80 > width) leftPos = width - 88;
                    if (topPos < 0) topPos = param.point.y + 10;
                    
                    tooltip.style.left = leftPos + 'px';
                    tooltip.style.top = topPos + 'px';
                }
            }
        });

        // Format data as OHLC (all same value to create line effect)
        const formattedData = data.map(item => {
            const value = item.value || item.close || item.price;
            if (value == null || isNaN(value)) return null;
            
            return {
                time: item.time,
                open: value,
                high: value,
                low: value,
                close: value,
            };
        }).filter(item => item != null);

        if (formattedData.length > 0) {
            series.setData(formattedData);
            chart.timeScale().fitContent();
        }

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (tooltip && tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
            chart.remove();
        };
    }, [data, isPositive]);

    if (!data || data.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <span className="text-xs text-gray-400">No data</span>
            </div>
        );
    }

    return (
        <div
            ref={chartContainerRef}
            className="w-full h-full"
            style={{ minHeight: '6rem' }}
        />
    );
}

