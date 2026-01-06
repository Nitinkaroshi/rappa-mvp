import { Shield, AlertTriangle, CheckCircle, AlertCircle, Info, Eye } from 'lucide-react';
import { useState } from 'react';

export default function FraudDetectionPanel({ fraudAnalysis }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!fraudAnalysis) {
    return null;
  }

  const { overall_risk_level, risk_score, max_risk_score, recommendation, flags, detailed_analysis } = fraudAnalysis;

  // Risk level colors
  const getRiskColor = (level) => {
    switch (level) {
      case 'high':
        return {
          bg: 'bg-red-50',
          border: 'border-red-300',
          text: 'text-red-900',
          badge: 'bg-red-100 text-red-700',
          icon: 'text-red-600'
        };
      case 'medium':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-300',
          text: 'text-yellow-900',
          badge: 'bg-yellow-100 text-yellow-700',
          icon: 'text-yellow-600'
        };
      case 'low':
      default:
        return {
          bg: 'bg-green-50',
          border: 'border-green-300',
          text: 'text-green-900',
          badge: 'bg-green-100 text-green-700',
          icon: 'text-green-600'
        };
    }
  };

  const colors = getRiskColor(overall_risk_level);

  const RiskIcon = overall_risk_level === 'high' ? AlertTriangle :
                   overall_risk_level === 'medium' ? AlertCircle :
                   CheckCircle;

  return (
    <div className={`rounded-lg border-2 ${colors.border} ${colors.bg} overflow-hidden`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-white shadow-sm`}>
              <Shield className={`w-6 h-6 ${colors.icon}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Fraud Detection Analysis</h3>
              <p className="text-sm text-gray-600">
                Automated security check completed
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Risk Score */}
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {risk_score}/{max_risk_score}
              </div>
              <div className="text-xs text-gray-600">Risk Score</div>
            </div>

            {/* Risk Level Badge */}
            <div className={`px-4 py-2 rounded-lg ${colors.badge} font-semibold flex items-center gap-2`}>
              <RiskIcon className="w-5 h-5" />
              <span className="uppercase">{overall_risk_level} RISK</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-start gap-2">
          <Info className={`w-5 h-5 ${colors.icon} mt-0.5`} />
          <div>
            <p className="text-sm font-medium text-gray-900">Recommendation:</p>
            <p className="text-sm text-gray-700">{recommendation}</p>
          </div>
        </div>
      </div>

      {/* Flags Summary */}
      {flags && flags.length > 0 && (
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">
              Detected Issues ({flags.length})
            </h4>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <Eye className="w-4 h-4" />
              {showDetails ? 'Hide Details' : 'View Details'}
            </button>
          </div>

          <div className="space-y-2">
            {flags.map((flag, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{flag}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Analysis (Expandable) */}
      {showDetails && detailed_analysis && (
        <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-4">
          <h4 className="font-semibold text-gray-900 mb-3">Detailed Analysis</h4>

          {/* Duplicate Detection */}
          {detailed_analysis.duplicate_detection && (
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <h5 className="font-semibold text-sm text-gray-900 mb-2">Duplicate Detection</h5>
              {detailed_analysis.duplicate_detection.is_duplicate ? (
                <div className="space-y-1 text-sm">
                  <p className="text-red-700 font-medium">⚠️ Duplicate document detected</p>
                  <p className="text-gray-600">Original Job ID: {detailed_analysis.duplicate_detection.original_job_id}</p>
                  <p className="text-gray-600">Original Filename: {detailed_analysis.duplicate_detection.original_filename}</p>
                  <p className="text-gray-600">Upload Date: {new Date(detailed_analysis.duplicate_detection.original_upload_date).toLocaleDateString()}</p>
                </div>
              ) : (
                <p className="text-sm text-green-700">✓ No duplicates found</p>
              )}
            </div>
          )}

          {/* Metadata Analysis */}
          {detailed_analysis.metadata_analysis && (
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <h5 className="font-semibold text-sm text-gray-900 mb-2">
                Metadata Analysis
                <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                  detailed_analysis.metadata_analysis.risk_level === 'high' ? 'bg-red-100 text-red-700' :
                  detailed_analysis.metadata_analysis.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {detailed_analysis.metadata_analysis.risk_level} risk
                </span>
              </h5>
              {detailed_analysis.metadata_analysis.manipulation_indicators && detailed_analysis.metadata_analysis.manipulation_indicators.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {detailed_analysis.metadata_analysis.manipulation_indicators.map((indicator, idx) => (
                    <li key={idx} className="text-orange-700">• {indicator}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-green-700">✓ No manipulation indicators detected</p>
              )}
            </div>
          )}

          {/* Consistency Check */}
          {detailed_analysis.consistency_check && (
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <h5 className="font-semibold text-sm text-gray-900 mb-2">
                Text Consistency Check
                <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                  detailed_analysis.consistency_check.risk_level === 'high' ? 'bg-red-100 text-red-700' :
                  detailed_analysis.consistency_check.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {detailed_analysis.consistency_check.risk_level} risk
                </span>
              </h5>
              {detailed_analysis.consistency_check.consistency_issues && detailed_analysis.consistency_check.consistency_issues.length > 0 ? (
                <div className="space-y-2">
                  {detailed_analysis.consistency_check.consistency_issues.map((issue, idx) => (
                    <div key={idx} className="text-sm">
                      <p className={`font-medium ${issue.severity === 'high' ? 'text-red-700' : 'text-yellow-700'}`}>
                        {issue.issue}
                      </p>
                      <p className="text-gray-600 ml-4">{issue.details}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-green-700">✓ All values are consistent</p>
              )}
            </div>
          )}

          {/* Confidence Analysis */}
          {detailed_analysis.confidence_analysis && (
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <h5 className="font-semibold text-sm text-gray-900 mb-2">
                Confidence Score Analysis
                <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                  detailed_analysis.confidence_analysis.risk_level === 'high' ? 'bg-red-100 text-red-700' :
                  detailed_analysis.confidence_analysis.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {detailed_analysis.confidence_analysis.risk_level} risk
                </span>
              </h5>
              <div className="space-y-2 text-sm">
                <p className="text-gray-700">
                  Average Confidence: <span className="font-semibold">{(detailed_analysis.confidence_analysis.average_confidence * 100).toFixed(1)}%</span>
                </p>
                {detailed_analysis.confidence_analysis.low_confidence_fields && detailed_analysis.confidence_analysis.low_confidence_fields.length > 0 ? (
                  <div>
                    <p className="text-orange-700 font-medium mb-1">Fields with low confidence:</p>
                    <ul className="space-y-1 ml-4">
                      {detailed_analysis.confidence_analysis.low_confidence_fields.map((field, idx) => (
                        <li key={idx} className="text-gray-700">
                          <span className="font-medium">{field.field}</span>: {(parseFloat(field.confidence) * 100).toFixed(1)}% - {field.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-green-700">✓ All fields have good confidence scores</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
