/**
 * MinHeap - Priority Queue Implementation for Hospital Emergency Queue
 * 
 * A Min-Heap based Priority Queue where lower priority numbers
 * indicate higher urgency (P1 = most urgent, P5 = least urgent).
 * Ties are broken by arrival time (earlier = higher priority).
 * 
 * Time Complexities:
 *   insert()     → O(log n)
 *   extractMin() → O(log n)
 *   peek()       → O(1)
 *   size()       → O(1)
 * 
 * Space Complexity: O(n)
 */

class MinHeap {
    constructor() {
        /** @type {Array<{id: number, name: string, age: number, priority: number, condition: string, timestamp: number}>} */
        this.heap = [];
        this._idCounter = 0;
        /** @type {Array<{type: string, message: string, indices?: number[]}>} */
        this.operationLog = [];
    }

    // ─── Helper Methods ────────────────────────────────────────

    _parent(i) { return Math.floor((i - 1) / 2); }
    _left(i)   { return 2 * i + 1; }
    _right(i)  { return 2 * i + 2; }

    /**
     * Compare two elements: returns true if a has higher priority than b.
     * Lower priority number = higher urgency.
     * Ties broken by earlier timestamp.
     */
    _hasHigherPriority(a, b) {
        if (a.priority !== b.priority) return a.priority < b.priority;
        return a.timestamp < b.timestamp;
    }

    _swap(i, j) {
        this.operationLog.push({
            type: 'swap',
            message: `Swap index [${i}] (P${this.heap[i].priority} ${this.heap[i].name}) ↔ [${j}] (P${this.heap[j].priority} ${this.heap[j].name})`,
            indices: [i, j]
        });
        [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
    }

    // ─── Core Operations ───────────────────────────────────────

    /**
     * Insert a new patient into the priority queue.
     * @param {string} name - Patient name
     * @param {number} age - Patient age
     * @param {number} priority - Triage level (1-5)
     * @param {string} condition - Medical condition
     * @returns {object} The inserted patient object
     */
    insert(name, age, priority, condition) {
        this.operationLog = [];

        const patient = {
            id: ++this._idCounter,
            name,
            age,
            priority,
            condition: condition || 'Not specified',
            timestamp: Date.now()
        };

        this.heap.push(patient);
        const insertedIndex = this.heap.length - 1;

        this.operationLog.push({
            type: 'insert',
            message: `INSERT "${name}" (P${priority}) at index [${insertedIndex}]`
        });

        this._bubbleUp(insertedIndex);

        this.operationLog.push({
            type: 'info',
            message: `Heap size is now ${this.heap.length}. Heap property maintained.`
        });

        return patient;
    }

    /**
     * Remove and return the highest-priority patient (root of the heap).
     * @returns {object|null} The extracted patient, or null if empty
     */
    extractMin() {
        this.operationLog = [];

        if (this.heap.length === 0) {
            this.operationLog.push({ type: 'error', message: 'Cannot extract — queue is empty!' });
            return null;
        }

        const min = this.heap[0];
        this.operationLog.push({
            type: 'extract',
            message: `EXTRACT-MIN: "${min.name}" (P${min.priority}) from root [0]`
        });

        const last = this.heap.pop();

        if (this.heap.length > 0) {
            this.heap[0] = last;
            this.operationLog.push({
                type: 'info',
                message: `Move last element "${last.name}" (P${last.priority}) to root [0]`
            });
            this._heapifyDown(0);
        }

        this.operationLog.push({
            type: 'info',
            message: `Heap size is now ${this.heap.length}. Heap property maintained.`
        });

        return min;
    }

    /**
     * View the highest-priority patient without removing.
     * @returns {object|null}
     */
    peek() {
        return this.heap.length > 0 ? this.heap[0] : null;
    }

    /** @returns {number} Current queue size */
    size() { return this.heap.length; }

    /** @returns {boolean} Whether the queue is empty */
    isEmpty() { return this.heap.length === 0; }

    /** Clear the entire heap */
    clear() {
        this.heap = [];
        this.operationLog = [{ type: 'info', message: 'Queue cleared.' }];
    }

    /** Get a shallow copy of the internal array (for visualization) */
    getArray() { return [...this.heap]; }

    /** Count patients at a specific priority level */
    countByPriority(level) {
        return this.heap.filter(p => p.priority === level).length;
    }

    // ─── Heap Maintenance ──────────────────────────────────────

    /**
     * Bubble Up: After insertion, restore heap property by
     * moving the element up while it has higher priority than its parent.
     * @param {number} i - Index to bubble up from
     */
    _bubbleUp(i) {
        while (i > 0) {
            const parentIdx = this._parent(i);
            if (this._hasHigherPriority(this.heap[i], this.heap[parentIdx])) {
                this._swap(i, parentIdx);
                i = parentIdx;
            } else {
                break;
            }
        }
    }

    /**
     * Heapify Down: After extraction, restore heap property by
     * moving the element down, always swapping with the smallest child.
     * @param {number} i - Index to heapify down from
     */
    _heapifyDown(i) {
        const n = this.heap.length;
        while (true) {
            let smallest = i;
            const left = this._left(i);
            const right = this._right(i);

            if (left < n && this._hasHigherPriority(this.heap[left], this.heap[smallest])) {
                smallest = left;
            }
            if (right < n && this._hasHigherPriority(this.heap[right], this.heap[smallest])) {
                smallest = right;
            }

            if (smallest !== i) {
                this._swap(i, smallest);
                i = smallest;
            } else {
                break;
            }
        }
    }
}
