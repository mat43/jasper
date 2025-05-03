// components/InfoCard.js
export default function InfoCard({ title, children, className = '' }) {
	return (
		<div className={`bg-white rounded-lg shadow p-4 ${className}`}>
			<h2 className="text-sm font-medium mb-3">{title}</h2>
			{children}
		</div>
	)
}
