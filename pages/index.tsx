import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    const { data, error } = await supabase.from('campaigns').select('*');
    if (error) console.error(error);
    else setCampaigns(data);
  };

  const handleUpload = async (campaignId: string) => {
    if (!file || !user) return;
    setUploading(true);
    const filePath = `${user.id}/${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('exhibitor-uploads')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      alert('Upload failed');
      setUploading(false);
      return;
    }

    const fileUrl = supabase.storage.from('exhibitor-uploads').getPublicUrl(filePath).data.publicUrl;

    await supabase.from('exhibitor_submissions').insert({
      user_id: user.id,
      campaign_id: campaignId,
      file_url: fileUrl,
      brand_name: 'Example Brand',
      status: 'Submitted'
    });

    alert('File uploaded and submission recorded!');
    setUploading(false);
    setFile(null);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Exhibitor Portal</h1>
      {user ? (
        <div>
          <h2 className="text-xl mb-2">Welcome, {user.email}</h2>
          <ul>
            {campaigns.map((c) => (
              <li key={c.id} className="mb-4 border p-4 rounded">
                <div className="font-semibold">{c.name}</div>
                <div className="text-sm text-gray-600">Deadline: {c.deadline}</div>
                <input
                  type="file"
                  className="mt-2"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <button
                  onClick={() => handleUpload(c.id)}
                  className="bg-blue-500 text-white px-4 py-1 rounded mt-2 disabled:opacity-50"
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Submit File'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>Please sign in.</p>
      )}
    </div>
  );
}