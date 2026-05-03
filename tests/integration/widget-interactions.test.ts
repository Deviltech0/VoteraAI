/**
 * Widget Interaction Integration Tests — Cross-widget flows.
 *
 * Tests state management synchronization, store subscriptions,
 * and widget interaction patterns.
 *
 * @module tests/integration/widget-interactions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ElectionStore } from '../../src/state/store';
import { JourneyStageId, ElectionCategory } from '../../src/types/index';

describe('Store — State Synchronization', () => {
  let appStore: ElectionStore;

  beforeEach(() => {
    appStore = new ElectionStore();
  });

  it('multiple subscribers receive the same state snapshot', () => {
    const states1: JourneyStageId[] = [];
    const states2: JourneyStageId[] = [];

    appStore.subscribe((state) => states1.push(state.currentStage));
    appStore.subscribe((state) => states2.push(state.currentStage));

    appStore.goToStage(JourneyStageId.REGISTRATION);

    expect(states1).toEqual(states2);
  });

  it('rapid sequential state changes maintain consistency', () => {
    const stages = Object.values(JourneyStageId);
    const received: JourneyStageId[] = [];

    appStore.subscribe((state) => received.push(state.currentStage));

    stages.forEach((stage) => appStore.goToStage(stage));

    // Should have initial + one per stage change
    expect(received.length).toBe(stages.length + 1);
    expect(received[received.length - 1]).toBe(stages[stages.length - 1]);
  });

  it('election type selection persists through stage changes', () => {
    appStore.selectElectionType(ElectionCategory.LOK_SABHA);
    appStore.goToStage(JourneyStageId.REGISTRATION);
    appStore.goToStage(JourneyStageId.POLLING_DAY);

    expect(appStore.getState().selectedElectionType).toBe(ElectionCategory.LOK_SABHA);
  });

  it('coach toggle state is independent of stage navigation', () => {
    appStore.toggleCoach();
    expect(appStore.getState().isCoachOpen).toBe(true);

    appStore.goToStage(JourneyStageId.TIMELINE);
    expect(appStore.getState().isCoachOpen).toBe(true);
  });

  it('reset clears all state including coach and election type', () => {
    appStore.toggleCoach();
    appStore.selectElectionType(ElectionCategory.PANCHAYAT);
    appStore.goToStage(JourneyStageId.POST_VOTE);

    appStore.reset();

    const state = appStore.getState();
    expect(state.currentStage).toBe(JourneyStageId.ELIGIBILITY);
    expect(state.isCoachOpen).toBe(false);
    expect(state.selectedElectionType).toBeNull();
  });

  it('multiple unsubscriptions do not interfere with each other', () => {
    let count1 = 0;
    let count2 = 0;

    const unsub1 = appStore.subscribe(() => { count1++; });
    const unsub2 = appStore.subscribe(() => { count2++; });

    unsub1();
    appStore.goToStage(JourneyStageId.REGISTRATION);

    // count1 should only have the initial call, count2 should have initial + 1
    expect(count1).toBe(1);
    expect(count2).toBe(2);

    unsub2();
    appStore.goToStage(JourneyStageId.TIMELINE);
    expect(count2).toBe(2); // No more updates
  });

  it('getState returns a snapshot, not a live reference', () => {
    const state1 = appStore.getState();
    appStore.goToStage(JourneyStageId.POST_VOTE);
    const state2 = appStore.getState();

    expect(state1.currentStage).toBe(JourneyStageId.ELIGIBILITY);
    expect(state2.currentStage).toBe(JourneyStageId.POST_VOTE);
  });
});
