import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, MessageSquare, Trash2, Reply, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

interface Review {
  id: number;
  rating: number;
  comment: string;
  admin_reply?: string;
  created_at: string;
  user?: { name: string };
  food?: { name: string; image_url?: string };
}

export default function AdminReviews() {
  const queryClient = useQueryClient();
  const [replyingReviewId, setReplyingReviewId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['adminReviews'],
    queryFn: async () => {
      const res = await api.get('/reviews');
      return res.data;
    },
  });

  const reviews: Review[] = data?.data || [];

  const replyMutation = useMutation({
    mutationFn: async ({ id, admin_reply }: { id: number; admin_reply: string }) => {
      await api.put(`/reviews/${id}`, { admin_reply });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReviews'] });
      toast.success('Manager reply posted!');
      setReplyingReviewId(null);
      setReplyText('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/reviews/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReviews'] });
      toast.success('Review deleted');
    },
  });

  const handleSendReply = (id: number) => {
    if (!replyText.trim()) return;
    replyMutation.mutate({ id, admin_reply: replyText.trim() });
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      <div>
        <span className="bg-amber-100 text-amber-800 font-extrabold text-xs uppercase px-3 py-1 rounded-full inline-block mb-1">
          Customer Feedback
        </span>
        <h1 className="text-3xl font-black text-gray-900">Food Reviews & Manager Replies</h1>
        <p className="text-gray-500 text-sm mt-1">
          Monitor customer ratings on Snad Kitchen meals and respond directly to feedback.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800">No customer reviews yet</h3>
          <p className="text-gray-400 text-xs mt-1">Reviews will appear here as customers rate their delivered orders.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div key={rev.id} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center font-bold text-base">
                    {rev.user?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-base">{rev.user?.name || 'Anonymous Customer'}</h4>
                    <span className="text-xs text-gray-400">
                      Reviewed meal: <strong className="text-gray-700">{rev.food?.name}</strong> •{' '}
                      {new Date(rev.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${s <= rev.rating ? 'fill-amber-400' : 'text-gray-200 fill-none'}`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => deleteMutation.mutate(rev.id)}
                    className="text-gray-400 hover:text-red-600 p-1 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {rev.comment && <p className="text-sm text-gray-700 font-medium bg-gray-50 p-4 rounded-2xl">{rev.comment}</p>}

              {rev.admin_reply ? (
                <div className="bg-orange-50/70 border border-orange-100 rounded-2xl p-4 text-xs">
                  <span className="font-extrabold text-orange-700 block mb-1">Snad Kitchen Manager Reply:</span>
                  <p className="text-gray-800 font-medium">{rev.admin_reply}</p>
                </div>
              ) : replyingReviewId === rev.id ? (
                <div className="space-y-2 pt-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a professional manager reply..."
                    rows={2}
                    className="w-full p-3 rounded-2xl border border-gray-200 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setReplyingReviewId(null)}
                      className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSendReply(rev.id)}
                      disabled={replyMutation.isPending}
                      className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-bold transition"
                    >
                      Post Reply
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setReplyingReviewId(rev.id);
                    setReplyText('');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700"
                >
                  <Reply className="w-4 h-4" />
                  <span>Reply to customer</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
