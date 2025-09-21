import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { careerGuideAPI } from '../services/api';
import { Loader2, PlayCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Section = ({ title, children }) => (
  <section className="bg-white rounded-lg shadow p-6 mb-6">
    <h2 className="text-xl font-semibold mb-4">{title}</h2>
    {children}
  </section>
);

const CareerGuide = () => {
  const { isAuthenticated } = useAuth();
  const userId = localStorage.getItem('userId');
  const [loading, setLoading] = useState(true);
  const [guide, setGuide] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchGuide = async () => {
      try {
        setLoading(true);
        const { data } = await careerGuideAPI.getGuide(userId);
        setGuide(data.data);
      } catch (err) {
        toast.error('Failed to load career guide');
      } finally {
        setLoading(false);
      }
    };
    if (isAuthenticated && userId) fetchGuide();
  }, [isAuthenticated, userId]);

  const saveGoals = async () => {
    if (!guide?.recommendedGoals?.length) return;
    try {
      setSaving(true);
      await careerGuideAPI.saveGoals(userId, guide.recommendedGoals);
      toast.success('Starter goals saved to your progress');
    } catch (e) {
      toast.error('Could not save goals');
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center text-gray-600">Please log in to view your personalized career guide.</div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-600">
        <Loader2 className="animate-spin mr-2" /> Loading your guide...
      </div>
    );
  }

  if (!guide) {
    return <div className="text-center text-gray-600">No guide available.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Personalized Career Guide</h1>
          <p className="text-gray-600">Target role: {guide.meta?.targetRole} • Readiness: {guide.overview?.overallReadiness || 0}%</p>
        </div>
        <button
          onClick={saveGoals}
          disabled={saving}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Starter Goals'}
        </button>
      </div>

      <Section title="Getting started">
        <ul className="grid md:grid-cols-3 gap-4">
          {guide.gettingStarted?.map((step, idx) => (
            <li key={idx} className="border rounded-lg p-4">
              <div className="font-medium mb-2">{step.title}</div>
              <ul className="list-disc pl-5 text-gray-700 space-y-1 text-sm">
                {step.items.map((i, j) => <li key={j}>{i}</li>)}
              </ul>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Roadmap">
        <div className="space-y-4">
          {guide.roadmap?.map((p, idx) => (
            <div key={idx} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{p.phase}</div>
                <span className="text-sm text-gray-600">{p.focus}</span>
              </div>
              <div className="mt-2 text-sm text-gray-700">Key skills: {p.skills?.join(', ')}</div>
              <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 space-y-1">
                {p.actions?.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Recommended courses">
        <div className="grid md:grid-cols-3 gap-4">
          {guide.recommendedCourses?.map((c) => (
            <div key={c.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">{c.title}</div>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">{c.provider}</span>
              </div>
              <div className="text-sm text-gray-700">Duration: {c.timeToComplete}</div>
              <div className="text-sm text-gray-700">Impact: {c.estimatedImpact}</div>
              <div className="text-xs text-gray-600 mt-1">Why: {c.reason}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Starter projects">
        <div className="grid md:grid-cols-2 gap-4">
          {guide.starterProjects?.map((p, i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="flex items-center gap-2 font-medium"><PlayCircle size={16} /> {p.title}</div>
              <div className="text-sm text-gray-700 mt-1">{p.description}</div>
              <div className="text-xs text-gray-600 mt-1">Skills: {p.skills?.join(', ')} • {p.difficulty}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="FAQ">
        <div className="space-y-2">
          {guide.faq?.map((f, i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="font-medium">{f.q}</div>
              <div className="text-sm text-gray-700">{f.a}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
};

export default CareerGuide;
