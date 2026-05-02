import { createWithEqualityFn } from 'zustand/traditional';

export const useAppStore = createWithEqualityFn((set) => ({
  isVrActive: false,
  setVrActive: (status) => set({ isVrActive: status }),

  // الجزيء اللي اخترناه هسه بالـ VR - إذا null يعني ما في شي
  selectedModel: null,
  setSelectedModel: (model) => set({ selectedModel: model }),

  // وضع الـ DNA - ببدل بين الجزيئات لحالها أو وهي ماسكة بالـ DNA
  isDnaMode: false,
  setDnaMode: (value) => set({ isDnaMode: value }),
  toggleDnaMode: () => set((state) => ({ isDnaMode: !state.isDnaMode })),
}));
