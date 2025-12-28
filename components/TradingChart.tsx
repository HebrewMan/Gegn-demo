
import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, CrosshairMode, CandlestickSeries, HistogramSeries, LineStyle, LineType } from 'lightweight-charts';

type TimeInterval = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1D' | '1W';

interface TradingChartProps {
  data: any[];
  symbol: string;
  interval?: TimeInterval;
  onIntervalChange?: (interval: TimeInterval) => void;
}

// Format volume: 
// - >= 1,000,000: show as "M" (million)
// - >= 10,000: show as "W" (万, ten thousand)
// - >= 1,000: show as "K" (thousand)
// - < 1,000: show as is with 2 decimal places
const formatVolume = (volume: number): string => {
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(2)}M`;
  } else if (volume >= 10000) {
    return `${(volume / 10000).toFixed(2)}W`;
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(2)}K`;
  } else {
    return volume.toFixed(2);
  }
};

// Format price: 
// - For numbers < 0: show 2 digits after the last zero (e.g., 0.0012345 -> 0.0012)
// - For numbers >= 0: show 7 decimal places (e.g., 0.1317 -> 0.1317000, 1.5 -> 1.5000000)
const formatPrice = (price: number): string => {
  if (price === 0) return '0.0000000';
  
  const isNegative = price < 0;
  const absPrice = Math.abs(price);
  
  // For numbers >= 0 (positive), always show 7 decimal places
  if (!isNegative) {
    return price.toFixed(7);
  }
  
  // For negative numbers < 0, find the last zero after decimal point
  const priceStr = absPrice.toString();
  const decimalIndex = priceStr.indexOf('.');
  if (decimalIndex === -1) {
    return price.toFixed(7);
  }
  
  // Find the last zero after decimal point
  let lastZeroIndex = -1;
  for (let i = decimalIndex + 1; i < priceStr.length; i++) {
    if (priceStr[i] === '0') {
      lastZeroIndex = i;
    } else if (priceStr[i] !== '0') {
      // Once we hit a non-zero digit, stop looking
      break;
    }
  }
  
  if (lastZeroIndex !== -1) {
    // Show 2 digits after the last zero
    // e.g., 0.0012345: last zero at index 4 (0.001), show 2 digits after = 0.0012
    const digitsAfterDecimal = lastZeroIndex - decimalIndex;
    const result = absPrice.toFixed(digitsAfterDecimal + 2);
    return `-${result}`;
  }
  
  // If no zero found after decimal, show 7 decimal places
  return price.toFixed(7);
};

const TradingChart: React.FC<TradingChartProps> = ({ data, symbol, interval = '1h', onIntervalChange }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const highPriceLineRef = useRef<any>(null);
  
  // Calculate historical high price
  const historicalHigh = data && data.length > 0 
    ? Math.max(...data.map(d => d.high))
    : 0;

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;
    
    const initChart = () => {
      const { clientWidth, clientHeight } = container;
      if (clientWidth === 0 || clientHeight === 0) {
        requestAnimationFrame(initChart);
        return;
      }

      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }

      const chart = createChart(container, {
        layout: {
          background: { type: ColorType.Solid, color: '#0a0b0d' },
          textColor: '#71717a',
          fontSize: 11,
          fontFamily: 'JetBrains Mono, monospace',
        },
        grid: {
          vertLines: { color: 'rgba(42, 46, 57, 0.05)' },
          horzLines: { color: 'rgba(42, 46, 57, 0.05)' },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: { 
            color: '#71717a',
            width: 1,
            style: 3,
            labelBackgroundColor: '#1a1b1f',
          },
          horzLine: { 
            color: '#71717a',
            width: 1,
            style: 3,
            labelBackgroundColor: '#1a1b1f',
          },
        },
        width: clientWidth,
        height: clientHeight,
        timeScale: {
          borderColor: '#1e222d',
          timeVisible: true,
          secondsVisible: false,
          barSpacing: 2, // Reduced from 8 to 2 to show more candles
          rightOffset: 12,
          fixLeftEdge: false,
          fixRightEdge: false,
          visible: true,
        },
        rightPriceScale: {
          borderColor: '#1e222d',
          scaleMargins: {
            top: 0.15, // Increased top margin to leave space above historical high line
            bottom: 0.05, // Reduced from 0.1 to show more price ticks
          },
          entireTextOnly: false,
          ticksVisible: true,
        },
        leftPriceScale: {
          visible: false,
        },
      });

      // Create the candlestick series using the correct API method
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
        priceScaleId: 'right',
      });

      // Add volume histogram series with 2 decimal places
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#26a69a33',
        priceFormat: {
          type: 'volume',
          precision: 2,
          minMove: 0.01,
        },
        priceScaleId: 'volume',
      });
      
      // Configure volume price scale
      chart.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
        entireTextOnly: false,
        ticksVisible: true,
      });
      
      // Set price formatter - use a smart formatter that detects volume vs price
      // Volume values are typically much larger than price values
      // We'll use a threshold to distinguish: if value > 100, it's likely volume
      chart.applyOptions({
        localization: {
          priceFormatter: (price: number) => {
            // If price is very large (> 100), it's likely volume, use volume formatter
            // Otherwise, it's a price, use price formatter
            if (Math.abs(price) > 100) {
              return formatVolume(price);
            }
            return formatPrice(price);
          },
        },
      });

      // Add historical high price line (red dashed line)
      const highPriceLine = candlestickSeries.createPriceLine({
        price: historicalHigh,
        color: '#ef5350', // Red color to match screenshot
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: '历史最高价',
      });
      highPriceLineRef.current = highPriceLine;

      chartRef.current = chart;
      seriesRef.current = { candlestick: candlestickSeries, volume: volumeSeries };

      // Enable zoom with mouse wheel (lightweight-charts has zoom enabled by default)
      // The chart automatically supports mouse wheel zoom and touch gestures

      if (data && data.length > 0) {
        const candlestickData = data.map(d => ({
          time: d.time,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }));
        const volumeData = data.map(d => {
          const volume = d.volume || Math.abs(d.close - d.open) * 1000000;
          // Round volume to 2 decimal places to ensure proper display
          const roundedVolume = Math.round(volume * 100) / 100;
          return {
            time: d.time,
            value: roundedVolume,
            color: d.close >= d.open ? '#26a69a80' : '#ef535080',
          };
        });
        candlestickSeries.setData(candlestickData);
        volumeSeries.setData(volumeData);
        
        // Set initial visible range to show more data (zoom out)
        // Show approximately 100-150 candles initially
        if (candlestickData.length > 0) {
          const visibleRange = Math.min(150, candlestickData.length);
          const firstVisibleTime = candlestickData[Math.max(0, candlestickData.length - visibleRange)]?.time;
          const lastVisibleTime = candlestickData[candlestickData.length - 1]?.time;
          
          if (firstVisibleTime && lastVisibleTime) {
            chart.timeScale().setVisibleRange({
              from: firstVisibleTime,
              to: lastVisibleTime,
            });
          }
        }
      }
    };

    const timer = setTimeout(initChart, 50);

    const handleResize = () => {
      if (chartRef.current && container) {
        chartRef.current.applyOptions({
          width: container.clientWidth,
          height: container.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, []); // Only initialize once

  // Update data when it changes
  useEffect(() => {
    if (seriesRef.current && data && data.length > 0) {
      const candlestickData = data.map(d => ({
        time: d.time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));
      const volumeData = data.map(d => {
        const volume = d.volume || Math.abs(d.close - d.open) * 1000000;
        // Round volume to 2 decimal places
        const roundedVolume = Math.round(volume * 100) / 100;
        return {
          time: d.time,
          value: roundedVolume,
          color: d.close >= d.open ? '#26a69a80' : '#ef535080',
        };
      });
      seriesRef.current.candlestick.setData(candlestickData);
      seriesRef.current.volume.setData(volumeData);
      
      // Update historical high price line
      const newHigh = Math.max(...data.map(d => d.high));
      if (highPriceLineRef.current && newHigh !== historicalHigh) {
        highPriceLineRef.current.applyOptions({
          price: newHigh,
        });
      }
    }
  }, [data, historicalHigh]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#0a0b0d]">
      <div ref={chartContainerRef} className="w-full h-full" />
      
      {/* Chart Overlay Info - Left aligned, positioned right below toolbar (toolbar is h-10 = 40px) */}
      {data && data.length > 0 && (
        <div className="absolute top-0 left-4 z-10 flex flex-col gap-1 pointer-events-none select-none">
          <div className="flex items-center gap-2">
            <span className="text-[#00ffa3] font-black text-[11px] uppercase tracking-wider">{symbol} · {interval.toUpperCase()} · GMGN</span>
            <div className="flex gap-2 text-[13px] font-mono text-gray-500">
              <span>开 <span className="text-gray-300">{formatPrice(data[data.length-1]?.open || 0)}</span></span>
              <span>高 <span className="text-[#26a69a]">{formatPrice(data[data.length-1]?.high || 0)}</span></span>
              <span>低 <span className="text-[#ef5350]">{formatPrice(data[data.length-1]?.low || 0)}</span></span>
              <span>收 <span className="text-gray-300">{formatPrice(data[data.length-1]?.close || 0)}</span></span>
            </div>
            {historicalHigh > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-gray-500">
                <span>历史最高价</span>
                <span className="text-gray-300 font-mono">{formatPrice(historicalHigh)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Watermark - GMGN.AI */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none z-0">
        <span className="text-[12vw] font-black tracking-[0.2em]">GMGN.AI</span>
      </div>
    </div>
  );
};

export default TradingChart;
