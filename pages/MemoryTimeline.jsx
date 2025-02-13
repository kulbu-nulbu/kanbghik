'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import Compressor from 'compressorjs';
import confetti from 'canvas-confetti';

// Use environment variables for production!
const supabaseUrl = 'https://azidvccaivmqeaegczwe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6aWR2Y2NhaXZtcWVhZWdjendlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0NTg3OTgsImV4cCI6MjA1NTAzNDc5OH0.vc9sYBjW62RCuH2urDKFq0ES284Lh2fqfO4fc4cSti0';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function MemoryTimeline() {
  const [memories, setMemories] = useState([]);
  const [loadingMemories, setLoadingMemories] = useState(true);
  const [newMemory, setNewMemory] = useState({
    title: '',
    date: '',
    caption: '',
    image: null,
  });
  const [showModal, setShowModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); // For full image modal

  // Fetch memories from Supabase
  const fetchMemories = useCallback(async () => {
    try {
      setLoadingMemories(true);
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .order('date', { ascending: true });
      if (error) {
        console.error('Error fetching memories:', error);
      } else {
        setMemories(data);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoadingMemories(false);
    }
  }, []);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  // Handle file upload and compression
  const handleUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    new Compressor(file, {
      quality: 0.6,
      success: (result) => {
        const fileName = `${uuidv4()}.jpg`;
        const filePath = `memories/${fileName}`;
        uploadImage(result, filePath);
      },
      error: (err) => {
        console.error('Compression error:', err);
        setIsUploading(false);
      },
    });
  };

  const uploadImage = async (file, path) => {
    const { error } = await supabase.storage.from('memories').upload(path, file);
    if (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
      return;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from('memories').getPublicUrl(path);
    setNewMemory((prev) => ({ ...prev, image: publicUrl }));
    setIsUploading(false);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ff6b6b', '#ff8787', '#f783ac'],
    });
  };

  // Save a new memory to Supabase
  const addMemory = async () => {
    const { title, date, image } = newMemory;
    if (!title || !date || !image) {
      alert('Please fill all fields and upload an image');
      return;
    }
    const { error } = await supabase.from('memories').insert([newMemory]);
    if (error) {
      console.error('Insert error:', error);
      alert('Failed to save memory: ' + error.message);
      return;
    }
    await fetchMemories();
    setNewMemory({ title: '', date: '', caption: '', image: null });
    setShowModal(false);
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
    });
  };

  // Allow closing modals with the Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showModal) setShowModal(false);
        if (selectedImage) setSelectedImage(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModal, selectedImage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-rose-50 p-4 sm:p-8 relative overflow-hidden">
      {/* Floating Hearts Background */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 2}s`,
            }}
          >
            ❤️
          </div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <header className="text-center mb-12 relative group">
          <div className="absolute -inset-2 bg-rose-100/50 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
          <h1 className="text-4xl sm:text-6xl font-bold text-rose-700 mb-6 font-greatvibes relative inline-block">
            <span className="bg-gradient-to-r from-rose-600 to-pink-500 bg-clip-text text-transparent">
              Our Love Memories
            </span>
            <div className="absolute -top-4 -right-8 animate-bounce origin-bottom-right">
              💖
            </div>
          </h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-br from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 active:scale-95 flex items-center mx-auto gap-2 font-semibold"
          >
            <span className="text-xl">🥰</span>
            <span className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
              Add Memory
            </span>
          </button>
        </header>

        {/* Add Memory Modal */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50 animate-fade-in">
            <div className="bg-white rounded-2xl p-8 w-11/12 max-w-2xl max-h-[90vh] overflow-y-auto relative border-4 border-rose-100 shadow-2xl transform transition-all duration-300 scale-95 group hover:scale-100">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-6 right-6 text-rose-500 hover:text-rose-700 text-3xl transition-transform hover:rotate-90"
                aria-label="Close modal"
              >
                &times;
              </button>
              <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-rose-600 to-pink-500 bg-clip-text text-transparent font-greatvibes">
                Preserve Our Precious Moment
              </h2>
              <div className="space-y-6">
                {/* Memory Title Input */}
                <div className="relative">
                <input
                    type="text"
                    required
                    value={newMemory.title}
                    onChange={(e) => setNewMemory({ ...newMemory, title: e.target.value })}
                    className="w-full p-4 border-2 border-rose-100 rounded-xl focus:border-rose-300 focus:ring-0 peer text-rose-700 placeholder-transparent"
                    placeholder="Memory Title" // placeholder text is needed for the effect but set to transparent
                />
                <label className="absolute left-4 transition-all duration-200 pointer-events-none bg-white px-1 text-rose-400
                    peer-placeholder-shown:top-4 peer-placeholder-shown:text-base
                    peer-focus:top-0 peer-focus:text-sm
                    peer-valid:top-0 peer-valid:text-sm">
                    Memory Title
                </label>
                </div>

                {/* Date Input with Floating Label */}
                <div className="relative mt-6">
                <input
                    type="date"
                    value={newMemory.date}
                    onChange={(e) => setNewMemory({ ...newMemory, date: e.target.value })}
                    className="w-full p-4 border-2 border-rose-100 rounded-xl text-rose-700 pr-12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-400 text-xl">
                    📅
                </span>
                </div>

                {/* Caption Textarea */}
                <div className="relative mt-6">
                <textarea
                    required
                    value={newMemory.caption}
                    onChange={(e) => setNewMemory({ ...newMemory, caption: e.target.value })}
                    className="w-full p-4 border-2 border-rose-100 rounded-xl h-32 resize-none focus:border-rose-300 focus:ring-0 peer text-rose-700 placeholder-transparent"
                    placeholder="Heartfelt Caption"
                />
                <label className="absolute left-4 transition-all duration-200 pointer-events-none bg-white px-1 text-rose-400
                    peer-placeholder-shown:top-4 peer-placeholder-shown:text-base
                    peer-focus:top-0 peer-focus:text-sm
                    peer-valid:top-0 peer-valid:text-sm">
                    Heartfelt Caption
                </label>
                </div>


                {/* Upload Button */}
                <label className="block w-full px-6 py-4 bg-rose-50/50 hover:bg-rose-100 border-2 border-dashed border-rose-200 rounded-2xl cursor-pointer transition-all duration-300 group/upload">
                  <div className="flex flex-col items-center justify-center gap-3 text-rose-600">
                    <div className="text-4xl transition-transform group-hover/upload:scale-125">
                      {isUploading ? '⏳' : '📷'}
                    </div>
                    <span className="font-medium">
                      {isUploading ? 'Preserving Moment...' : 'Upload Memory Photo'}
                    </span>
                    {isUploading && (
                      <div className="mt-2 w-8 h-1 bg-rose-200 rounded-full overflow-hidden">
                        <div className="w-full h-full bg-rose-500 animate-progress"></div>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>

                {/* Image Preview */}
                {newMemory.image && (
                  <div className="relative group/preview">
                    <div className="absolute inset-0 bg-rose-500/10 rounded-xl transform group-hover/preview:scale-105 transition-all duration-300" />
                    <div
                      className="relative aspect-square rounded-xl overflow-hidden border-2 border-rose-100 cursor-zoom-in transform transition-all duration-300 hover:scale-[1.02]"
                      onClick={() => setSelectedImage(newMemory.image)}
                    >
                      <Image
                        src={newMemory.image}
                        alt="Preview"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-4">
                        <span className="text-white font-medium">Preview</span>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={addMemory}
                  className="w-full py-4 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                  disabled={!newMemory.image || isUploading}
                >
                  <span className="text-xl">{!isUploading ? '💌' : '⏳'}</span>
                  {!isUploading ? 'Seal This Memory' : 'Saving...'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Memories Timeline for Mobile */}
        {loadingMemories ? (
          <p className="text-center text-rose-600">Loading memories...</p>
        ) : (
          <>
            <div className="md:hidden relative pl-8 border-l-4 border-rose-200/50 space-y-16">
              {memories.map((memory) => (
                <div key={memory.id} className="relative pl-8 group">
                  <div className="absolute w-6 h-6 bg-gradient-to-br from-rose-400 to-pink-400 rounded-full -left-[14px] top-6 flex items-center justify-center shadow-lg ring-4 ring-rose-50">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl border-2 border-rose-50 relative overflow-hidden transition-all duration-300 hover:-translate-y-2 group-hover:rotate-[0.5deg]">
                    <div className="absolute inset-0 bg-gradient-to-br from-white to-rose-50 opacity-50" />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-bold text-rose-700">
                          {memory.title}
                        </h3>
                        <span className="text-sm bg-rose-100 text-rose-600 px-3 py-1 rounded-full">
                          {new Date(memory.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <div
                        className="relative aspect-square rounded-xl overflow-hidden mb-4 cursor-zoom-in transform transition-all duration-300 hover:scale-[1.02]"
                        onClick={() => setSelectedImage(memory.image)}
                      >
                        <Image
                          src={memory.image}
                          alt={memory.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      </div>
                      <p className="text-rose-600/90 italic pl-4 border-l-4 border-rose-200">
                        {memory.caption}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Memories Grid for Desktop */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-8">
              {memories.map((memory) => (
                <div
                  key={memory.id}
                  className="bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl border-2 border-rose-50 relative overflow-hidden transition-all duration-300 hover:-translate-y-2 group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white to-rose-50 opacity-50" />
                  <div className="relative">
                    <div
                      className="relative aspect-square rounded-xl overflow-hidden mb-4 cursor-zoom-in transform transition-all duration-300 hover:scale-[1.02]"
                      onClick={() => setSelectedImage(memory.image)}
                    >
                      <Image
                        src={memory.image}
                        alt={memory.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent flex items-end p-4">
                        <h3 className="text-white font-bold text-xl">
                          {memory.title}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm bg-rose-100 text-rose-600 px-3 py-1 rounded-full">
                        {new Date(memory.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="text-rose-600/90 italic pl-3 border-l-4 border-rose-200">
                      {memory.caption}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Full Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[999] animate-fade-in">
          <div className="relative w-full h-full max-w-screen-2xl max-h-screen p-8 flex items-center justify-center">
            <button
              className="absolute top-8 right-8 text-white text-4xl z-50 hover:text-rose-200 transition-colors"
              onClick={() => setSelectedImage(null)}
              aria-label="Close full image view"
            >
              &times;
            </button>
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={selectedImage}
                alt="Full view"
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl transform transition-all duration-300"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
