'use client'

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

// register the necessary chart pieces
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend
)

export default function SpendingBarChart({ data }) {
    // data = [{ category: 'Groceries', value: 1200 }, ...]
    const labels = data.map(d => d.category)
    const values = data.map(d => d.value)

    const chartData = {
        labels,
        datasets: [
            {
                label: 'This Month',
                data: values,
                backgroundColor: labels.map((_, i) => {
                    // pastel palette
                    return [
                        '#FDE68A', // amber-200
                        '#FECACA', // red-200
                        '#A7F3D0', // green-200
                        '#BFDBFE', // blue-200
                        '#E9D5FF', // purple-200
                    ][i % 5]
                }),
                borderRadius: 4,      // rounded bar corners
                maxBarThickness: 32,  // prevent overly thick bars
            },
        ],
    }

    const options = {
        maintainAspectRatio: false,
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#4B5563' } // gray-600
            },
            y: {
                beginAtZero: true,
                ticks: {
                    color: '#4B5563',
                    callback: (v) => `$${v}`, // prepend dollar sign
                },
                grid: {
                    color: '#E5E7EB', // gray-200
                },
            },
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                padding: 8,
                bodyFont: { size: 14 },
                callbacks: {
                    label: ctx => `$${ctx.parsed.y}`,
                }
            },
        },
    }

    return (
        <div className="w-full h-40">
            <Bar data={chartData} options={options} />
        </div>
    )
}
