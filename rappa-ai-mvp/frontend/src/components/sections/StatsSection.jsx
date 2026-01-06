function StatsSection() {
  const stats = [
    {
      value: '99.8%',
      label: 'OCR Accuracy',
      description: 'Industry-leading precision',
    },
    {
      value: '5-10s',
      label: 'Processing Time',
      description: 'Fast document extraction',
    },
    {
      value: '50+',
      label: 'Languages',
      description: 'Multi-language support',
    },
    {
      value: '24/7',
      label: 'Uptime',
      description: 'Enterprise-grade reliability',
    },
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Trusted Performance at Scale
          </h2>
          <p className="text-xl text-indigo-100 max-w-3xl mx-auto">
            Processing millions of documents with unmatched accuracy and speed
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center group">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2 group-hover:scale-110 transition-transform">
                {stat.value}
              </div>
              <div className="text-lg font-semibold mb-1 text-indigo-100">{stat.label}</div>
              <div className="text-sm text-indigo-200">{stat.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default StatsSection;
