
import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, CrosshairMode, CandlestickSeries, HistogramSeries } from 'lightweight-charts';

interface TradingChartProps {
  data: any[];
  symbol: string;
}

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

const TradingChart: React.FC<TradingChartProps> = ({ data, symbol }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);

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
          barSpacing: 8,
        },
        rightPriceScale: {
          borderColor: '#1e222d',
          scaleMargins: {
            top: 0.2,
            bottom: 0.2,
          },
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

      // Add volume histogram series
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#26a69a33',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume',
      });
      
      // Configure volume price scale
      chart.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });

      chartRef.current = chart;
      seriesRef.current = { candlestick: candlestickSeries, volume: volumeSeries };

      if (data && data.length > 0) {
        const candlestickData = data.map(d => ({
          time: d.time,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }));
        const volumeData = data.map(d => ({
          time: d.time,
          value: d.volume || Math.abs(d.close - d.open) * 1000000, // Use volume if available, otherwise calculate
          color: d.close >= d.open ? '#26a69a80' : '#ef535080',
        }));
        candlestickSeries.setData(candlestickData);
        volumeSeries.setData(volumeData);
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
      const volumeData = data.map(d => ({
        time: d.time,
        value: d.volume || Math.abs(d.close - d.open) * 1000000,
        color: d.close >= d.open ? '#26a69a80' : '#ef535080',
      }));
      seriesRef.current.candlestick.setData(candlestickData);
      seriesRef.current.volume.setData(volumeData);
    }
  }, [data]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#0a0b0d]">
      <div ref={chartContainerRef} className="w-full h-full" />
      
      {/* Chart Overlay Info */}
      {data && data.length > 0 && (
        <div className="absolute top-3 left-4 z-10 flex flex-col gap-1 pointer-events-none select-none">
          <div className="flex items-center gap-2">
            <span className="text-[#00ffa3] font-black text-[11px] uppercase tracking-wider">{symbol} · 1H · GMGN</span>
            <div className="flex gap-2 text-[10px] font-mono text-gray-500">
              <span>O <span className="text-gray-300">{formatPrice(data[data.length-1]?.open || 0)}</span></span>
              <span>H <span className="text-[#26a69a]">{formatPrice(data[data.length-1]?.high || 0)}</span></span>
              <span>L <span className="text-[#ef5350]">{formatPrice(data[data.length-1]?.low || 0)}</span></span>
              <span>C <span className="text-gray-300">{formatPrice(data[data.length-1]?.close || 0)}</span></span>
            </div>
          </div>
        </div>
      )}

      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none z-0">
        <span className="text-[12vw] font-black tracking-[0.2em]">GMGN.AI</span>
      </div>
    </div>
  );
};

export default TradingChart;
