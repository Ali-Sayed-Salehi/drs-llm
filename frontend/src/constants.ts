const DEFAULT_DIFF_1 = `diff --git a/flink-runtime/src/main/java/org/apache/flink/runtime/io/network/api/writer/BroadcastRecordWriter.java b/flink-runtime/src/main/java/org/apache/flink/runtime/io/network/api/writer/BroadcastRecordWriter.java
index effff59a105af..7544af20177c9 100644
--- a/flink-runtime/src/main/java/org/apache/flink/runtime/io/network/api/writer/BroadcastRecordWriter.java
+++ b/flink-runtime/src/main/java/org/apache/flink/runtime/io/network/api/writer/BroadcastRecordWriter.java
@@ -18,30 +18,164 @@

 package org.apache.flink.runtime.io.network.api.writer;

+import org.apache.flink.annotation.VisibleForTesting;
 import org.apache.flink.core.io.IOReadableWritable;
+import org.apache.flink.runtime.io.network.buffer.BufferBuilder;
+import org.apache.flink.runtime.io.network.buffer.BufferConsumer;

 import java.io.IOException;
+import java.util.Optional;
+
+import static org.apache.flink.util.Preconditions.checkState;

 /**
  * A special record-oriented runtime result writer only for broadcast mode.
  *
- * <p>The BroadcastRecordWriter extends the {@link RecordWriter} and handles {@link #emit(IOReadableWritable)}
- * operation via {@link #broadcastEmit(IOReadableWritable)} directly in a more efficient way.
+ * <p>The BroadcastRecordWriter extends the {@link RecordWriter} and maintain a single {@link BufferBuilder}
+ * for all the channels. Then the serialization results need be copied only once to this buffer which would be
+ * shared for all the channels in a more efficient way.
  *
  * @param <T> the type of the record that can be emitted with this record writer
  */
-public class BroadcastRecordWriter<T extends IOReadableWritable> extends RecordWriter<T> {
+public final class BroadcastRecordWriter<T extends IOReadableWritable> extends RecordWriter<T> {
+
+       /** The current buffer builder shared for all the channels. */
+       private Optional<BufferBuilder> bufferBuilder = Optional.empty();
+
+       /**
+        * The flag for judging whether {@link #requestNewBufferBuilder(int)} and {@link #flushTargetPartition(int)}
+        * is triggered by {@link #randomEmit(IOReadableWritable)} or not.
+        */
+       private boolean randomTriggered;

        BroadcastRecordWriter(
                        ResultPartitionWriter writer,
-                       ChannelSelector<T> channelSelector,
                        long timeout,
                        String taskName) {
-               super(writer, channelSelector, timeout, taskName);
+               super(writer, timeout, taskName);
        }

        @Override
        public void emit(T record) throws IOException, InterruptedException {
                broadcastEmit(record);
        }
+
+       @Override
+       public void randomEmit(T record) throws IOException, InterruptedException {
+               randomEmit(record, rng.nextInt(numberOfChannels));
+       }
+
+       /**
+        * For non-broadcast emit, we try to finish the current {@link BufferBuilder} first, and then request
+        * a new {@link BufferBuilder} for the random channel. If this new {@link BufferBuilder} is not full,
+        * it can be shared for all the other channels via initializing readable position in created
+        * {@link BufferConsumer}.
+        */
+       @VisibleForTesting
+       void randomEmit(T record, int targetChannelIndex) throws IOException, InterruptedException {
+               tryFinishCurrentBufferBuilder(targetChannelIndex);
+
+               randomTriggered = true;
+               emit(record, targetChannelIndex);
+               randomTriggered = false;
+
+               if (bufferBuilder.isPresent()) {
+                       for (int index = 0; index < numberOfChannels; index++) {
+                               if (index != targetChannelIndex) {
+                                       targetPartition.addBufferConsumer(bufferBuilder.get().createBufferConsumer(), index);
+                               }
+                       }
+               }
+       }
+
+       @Override
+       public void broadcastEmit(T record) throws IOException, InterruptedException {
+               // We could actually select any target channel here because all the channels
+               // are sharing the same BufferBuilder in broadcast mode.
+               emit(record, 0);
+       }
+
+       /**
+        * The flush could be triggered by {@link #randomEmit(IOReadableWritable)}, {@link #emit(IOReadableWritable)}
+        * or {@link #broadcastEmit(IOReadableWritable)}. Only random emit should flush a single target channel,
+        * otherwise we should flush all the channels.
+        */
+       @Override
+       public void flushTargetPartition(int targetChannel) {
+               if (randomTriggered) {
+                       super.flushTargetPartition(targetChannel);
+               } else {
+                       flushAll();
+               }
+       }
+
+       @Override
+       public BufferBuilder getBufferBuilder(int targetChannel) throws IOException, InterruptedException {
+               if (bufferBuilder.isPresent()) {
+                       return bufferBuilder.get();
+               } else {
+                       return requestNewBufferBuilder(targetChannel);
+               }
+       }
+
+       /**
+        * The request could be from broadcast or non-broadcast modes like {@link #randomEmit(IOReadableWritable)}.
+        *
+        * <p>For non-broadcast, the created {@link BufferConsumer} is only for the target channel.
+        *
+        * <p>For broadcast, all the channels share the same requested {@link BufferBuilder} and the created
+        * {@link BufferConsumer} is copied for every channel.
+        */
+       @Override
+       public BufferBuilder requestNewBufferBuilder(int targetChannel) throws IOException, InterruptedException {
+               checkState(!bufferBuilder.isPresent() || bufferBuilder.get().isFinished());
+
+               BufferBuilder builder = targetPartition.getBufferBuilder();
+               if (randomTriggered) {
+                       targetPartition.addBufferConsumer(builder.createBufferConsumer(), targetChannel);
+               } else {
+                       try (BufferConsumer bufferConsumer = builder.createBufferConsumer()) {
+                               for (int channel = 0; channel < numberOfChannels; channel++) {
+                                       targetPartition.addBufferConsumer(bufferConsumer.copy(), channel);
+                               }
+                       }
+               }
+
+               bufferBuilder = Optional.of(builder);
+               return builder;
+       }
+
+       @Override
+       public void tryFinishCurrentBufferBuilder(int targetChannel) {
+               if (!bufferBuilder.isPresent()) {
+                       return;
+               }
+
+               BufferBuilder builder = bufferBuilder.get();
+               bufferBuilder = Optional.empty();
+
+               finishBufferBuilder(builder);
+       }
+
+       @Override
+       public void emptyCurrentBufferBuilder(int targetChannel) {
+               bufferBuilder = Optional.empty();
+       }
+
+       @Override
+       public void closeBufferBuilder(int targetChannel) {
+               closeBufferBuilder();
+       }
+
+       @Override
+       public void clearBuffers() {
+               closeBufferBuilder();
+       }
+
+       private void closeBufferBuilder() {
+               if (bufferBuilder.isPresent()) {
+                       bufferBuilder.get().finish();
+                       bufferBuilder = Optional.empty();
+               }
+       }
 }
diff --git a/flink-runtime/src/main/java/org/apache/flink/runtime/io/network/api/writer/ChannelSelectorRecordWriter.java b/flink-runtime/src/main/java/org/apache/flink/runtime/io/network/api/writer/ChannelSelectorRecordWriter.java
new file mode 100644
index 0000000000000..eaeb5091f6506
--- /dev/null
+++ b/flink-runtime/src/main/java/org/apache/flink/runtime/io/network/api/writer/ChannelSelectorRecordWriter.java
@@ -0,0 +1,142 @@
+/*
+ * Licensed to the Apache Software Foundation (ASF) under one
+ * or more contributor license agreements.  See the NOTICE file
+ * distributed with this work for additional information
+ * regarding copyright ownership.  The ASF licenses this file
+ * to you under the Apache License, Version 2.0 (the
+ * "License"); you may not use this file except in compliance
+ * with the License.  You may obtain a copy of the License at
+ *
+ *     http://www.apache.org/licenses/LICENSE-2.0
+ *
+ * Unless required by applicable law or agreed to in writing, software
+ * distributed under the License is distributed on an "AS IS" BASIS,
+ * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
+ * See the License for the specific language governing permissions and
+ * limitations under the License.
+ */
+
+package org.apache.flink.runtime.io.network.api.writer;
+
+import org.apache.flink.core.io.IOReadableWritable;
+import org.apache.flink.runtime.io.network.buffer.BufferBuilder;
+
+import java.io.IOException;
+import java.util.Optional;
+
+import static org.apache.flink.util.Preconditions.checkNotNull;
+import static org.apache.flink.util.Preconditions.checkState;
+
+/**
+ * A regular record-oriented runtime result writer.
+ *
+ * <p>The ChannelSelectorRecordWriter extends the {@link RecordWriter} and maintains an array of
+ * {@link BufferBuilder}s for all the channels. The {@link #emit(IOReadableWritable)}
+ * operation is based on {@link ChannelSelector} to select the target channel.
+ *
+ * @param <T> the type of the record that can be emitted with this record writer
+ */
+public final class ChannelSelectorRecordWriter<T extends IOReadableWritable> extends RecordWriter<T> {
+
+       private final ChannelSelector<T> channelSelector;
+
+       private final Optional<BufferBuilder>[] bufferBuilders;
+
+       ChannelSelectorRecordWriter(
+                       ResultPartitionWriter writer,
+                       ChannelSelector<T> channelSelector,
+                       long timeout,
+                       String taskName) {
+               super(writer, timeout, taskName);
+
+               this.channelSelector = checkNotNull(channelSelector);
+               this.channelSelector.setup(numberOfChannels);
+
+               this.bufferBuilders = new Optional[numberOfChannels];
+               for (int i = 0; i < numberOfChannels; i++) {
+                       bufferBuilders[i] = Optional.empty();
+               }
+       }
+
+       @Override
+       public void emit(T record) throws IOException, InterruptedException {
+               emit(record, channelSelector.selectChannel(record));
+       }
+
+       @Override
+       public void randomEmit(T record) throws IOException, InterruptedException {
+               emit(record, rng.nextInt(numberOfChannels));
+       }
+
+       /**
+        * The record is serialized into intermediate serialization buffer which is then copied
+        * into the target buffer for every channel.
+        */
+       @Override
+       public void broadcastEmit(T record) throws IOException, InterruptedException {
+               checkErroneous();
+
+               serializer.serializeRecord(record);
+
+               boolean pruneAfterCopying = false;
+               for (int targetChannel = 0; targetChannel < numberOfChannels; targetChannel++) {
+                       if (copyFromSerializerToTargetChannel(targetChannel)) {
+                               pruneAfterCopying = true;
+                       }
+               }
+
+               if (pruneAfterCopying) {
+                       serializer.prune();
+               }
+       }
+
+       @Override
+       public BufferBuilder getBufferBuilder(int targetChannel) throws IOException, InterruptedException {
+               if (bufferBuilders[targetChannel].isPresent()) {
+                       return bufferBuilders[targetChannel].get();
+               } else {
+                       return requestNewBufferBuilder(targetChannel);
+               }
+       }
+
+       @Override
+       public BufferBuilder requestNewBufferBuilder(int targetChannel) throws IOException, InterruptedException {
+               checkState(!bufferBuilders[targetChannel].isPresent() || bufferBuilders[targetChannel].get().isFinished());
+
+               BufferBuilder bufferBuilder = targetPartition.getBufferBuilder();
+               targetPartition.addBufferConsumer(bufferBuilder.createBufferConsumer(), targetChannel);
+               bufferBuilders[targetChannel] = Optional.of(bufferBuilder);
+               return bufferBuilder;
+       }
+
+       @Override
+       public void tryFinishCurrentBufferBuilder(int targetChannel) {
+               if (!bufferBuilders[targetChannel].isPresent()) {
+                       return;
+               }
+               BufferBuilder bufferBuilder = bufferBuilders[targetChannel].get();
+               bufferBuilders[targetChannel] = Optional.empty();
+
+               finishBufferBuilder(bufferBuilder);
+       }
+
+       @Override
+       public void emptyCurrentBufferBuilder(int targetChannel) {
+               bufferBuilders[targetChannel] = Optional.empty();
+       }
+
+       @Override
+       public void closeBufferBuilder(int targetChannel) {
+               if (bufferBuilders[targetChannel].isPresent()) {
+                       bufferBuilders[targetChannel].get().finish();
+                       bufferBuilders[targetChannel] = Optional.empty();
+               }
+       }
+
+       @Override
+       public void clearBuffers() {
+               for (int index = 0; index < numberOfChannels; index++) {
+                       closeBufferBuilder(index);
+               }
+       }
+}
diff --git a/flink-runtime/src/main/java/org/apache/flink/runtime/io/network/api/writer/RecordWriter.java b/flink-runtime/src/main/java/org/apache/flink/runtime/io/network/api/writer/RecordWriter.java
index cc40df064ee78..b648eef3450ed 100644
--- a/flink-runtime/src/main/java/org/apache/flink/runtime/io/network/api/writer/RecordWriter.java
+++ b/flink-runtime/src/main/java/org/apache/flink/runtime/io/network/api/writer/RecordWriter.java
@@ -42,7 +42,7 @@
 import static org.apache.flink.util.Preconditions.checkState;

 /**
- * A record-oriented runtime result writer.
+ * An abstract record-oriented runtime result writer.
  *
  * <p>The RecordWriter wraps the runtime's {@link ResultPartitionWriter} and takes care of
  * serializing records into buffers.
@@ -54,23 +54,17 @@
  *
  * @param <T> the type of the record that can be emitted with this record writer
  */
-public class RecordWriter<T extends IOReadableWritable> {
+public abstract class RecordWriter<T extends IOReadableWritable> {

        private static final Logger LOG = LoggerFactory.getLogger(RecordWriter.class);

-       private final ResultPartitionWriter targetPartition;
+       protected final ResultPartitionWriter targetPartition;

-       private final ChannelSelector<T> channelSelector;
+       protected final int numberOfChannels;

-       private final int numberOfChannels;
+       protected final RecordSerializer<T> serializer;

-       private final int[] broadcastChannels;
-
-       private final RecordSerializer<T> serializer;
-
-       private final Optional<BufferBuilder>[] bufferBuilders;
-
-       private final Random rng = new XORShiftRandom();
+       protected final Random rng = new XORShiftRandom();

        private Counter numBytesOut = new SimpleCounter();

@@ -87,19 +81,11 @@ public class RecordWriter<T extends IOReadableWritable> {
        /** To avoid synchronization overhead on the critical path, best-effort error tracking is enough here.*/
        private Throwable flusherException;

-       RecordWriter(ResultPartitionWriter writer, ChannelSelector<T> channelSelector, long timeout, String taskName) {
+       RecordWriter(ResultPartitionWriter writer, long timeout, String taskName) {
                this.targetPartition = writer;
-               this.channelSelector = channelSelector;
                this.numberOfChannels = writer.getNumberOfSubpartitions();
-               this.channelSelector.setup(numberOfChannels);

                this.serializer = new SpanningRecordSerializer<T>();
-               this.bufferBuilders = new Optional[numberOfChannels];
-               this.broadcastChannels = new int[numberOfChannels];
-               for (int i = 0; i < numberOfChannels; i++) {
-                       broadcastChannels[i] = i;
-                       bufferBuilders[i] = Optional.empty();
-               }

                checkArgument(timeout >= -1);
                this.flushAlways = (timeout == 0);
@@ -115,42 +101,12 @@ public class RecordWriter<T extends IOReadableWritable> {
                }
        }

-       public void emit(T record) throws IOException, InterruptedException {
+       protected void emit(T record, int targetChannel) throws IOException, InterruptedException {
                checkErroneous();
-               emit(record, channelSelector.selectChannel(record));
-       }

-       /**
-        * This is used to broadcast Streaming Watermarks in-band with records. This ignores
-        * the {@link ChannelSelector}.
-        */
-       public void broadcastEmit(T record) throws IOException, InterruptedException {
-               checkErroneous();
                serializer.serializeRecord(record);

-               boolean pruneAfterCopying = false;
-               for (int channel : broadcastChannels) {
-                       if (copyFromSerializerToTargetChannel(channel)) {
-                               pruneAfterCopying = true;
-                       }
-               }
-
                // Make sure we don't hold onto the large intermediate serialization buffer for too long
-               if (pruneAfterCopying) {
-                       serializer.prune();
-               }
-       }
-
-       /**
-        * This is used to send LatencyMarks to a random target channel.
-        */
-       public void randomEmit(T record) throws IOException, InterruptedException {
-               emit(record, rng.nextInt(numberOfChannels));
-       }
-
-       private void emit(T record, int targetChannel) throws IOException, InterruptedException {
-               serializer.serializeRecord(record);
-
                if (copyFromSerializerToTargetChannel(targetChannel)) {
                        serializer.prune();
                }
@@ -160,7 +116,7 @@ private void emit(T record, int targetChannel) throws IOException, InterruptedEx
         * @param targetChannel
         * @return <tt>true</tt> if the intermediate serialization buffer should be pruned
         */
-       private boolean copyFromSerializerToTargetChannel(int targetChannel) throws IOException, InterruptedException {
+       protected boolean copyFromSerializerToTargetChannel(int targetChannel) throws IOException, InterruptedException {
                // We should reset the initial position of the intermediate serialization buffer before
                // copying, so the serialization results can be copied to multiple target buffers.
                serializer.reset();
@@ -169,15 +125,14 @@ private boolean copyFromSerializerToTargetChannel(int targetChannel) throws IOEx
                BufferBuilder bufferBuilder = getBufferBuilder(targetChannel);
                SerializationResult result = serializer.copyToBufferBuilder(bufferBuilder);
                while (result.isFullBuffer()) {
-                       numBytesOut.inc(bufferBuilder.finish());
-                       numBuffersOut.inc();
+                       finishBufferBuilder(bufferBuilder);

                        // If this was a full record, we are done. Not breaking out of the loop at this point
                        // will lead to another buffer request before breaking out (that would not be a
                        // problem per se, but it can lead to stalls in the pipeline).
                        if (result.isFullRecord()) {
                                pruneTriggered = true;
-                               bufferBuilders[targetChannel] = Optional.empty();
+                               emptyCurrentBufferBuilder(targetChannel);
                                break;
                        }

@@ -187,7 +142,7 @@ private boolean copyFromSerializerToTargetChannel(int targetChannel) throws IOEx
                checkState(!serializer.hasSerializedData(), "All data should be written at once");

                if (flushAlways) {
-                       targetPartition.flush(targetChannel);
+                       flushTargetPartition(targetChannel);
                }
                return pruneTriggered;
        }
@@ -211,10 +166,8 @@ public void flushAll() {
                targetPartition.flushAll();
        }

-       public void clearBuffers() {
-               for (int targetChannel = 0; targetChannel < numberOfChannels; targetChannel++) {
-                       closeBufferBuilder(targetChannel);
-               }
+       protected void flushTargetPartition(int targetChannel) {
+               targetPartition.flush(targetChannel);
        }

        /**
@@ -225,46 +178,56 @@ public void setMetricGroup(TaskIOMetricGroup metrics) {
                numBuffersOut = metrics.getNumBuffersOutCounter();
        }

-       /**
-        * Marks the current {@link BufferBuilder} as finished and clears the state for next one.
-        */
-       private void tryFinishCurrentBufferBuilder(int targetChannel) {
-               if (!bufferBuilders[targetChannel].isPresent()) {
-                       return;
-               }
-               BufferBuilder bufferBuilder = bufferBuilders[targetChannel].get();
-               bufferBuilders[targetChannel] = Optional.empty();
+       protected void finishBufferBuilder(BufferBuilder bufferBuilder) {
                numBytesOut.inc(bufferBuilder.finish());
                numBuffersOut.inc();
        }

+       /**
+        * This is used to send regular records.
+        */
+       public abstract void emit(T record) throws IOException, InterruptedException;
+
+       /**
+        * This is used to send LatencyMarks to a random target channel.
+        */
+       public abstract void randomEmit(T record) throws IOException, InterruptedException;
+
+       /**
+        * This is used to broadcast streaming Watermarks in-band with records.
+        */
+       public abstract void broadcastEmit(T record) throws IOException, InterruptedException;
+
        /**
         * The {@link BufferBuilder} may already exist if not filled up last time, otherwise we need
         * request a new one for this target channel.
         */
-       private BufferBuilder getBufferBuilder(int targetChannel) throws IOException, InterruptedException {
-               if (bufferBuilders[targetChannel].isPresent()) {
-                       return bufferBuilders[targetChannel].get();
-               } else {
-                       return requestNewBufferBuilder(targetChannel);
-               }
-       }
+       abstract BufferBuilder getBufferBuilder(int targetChannel) throws IOException, InterruptedException;

-       private BufferBuilder requestNewBufferBuilder(int targetChannel) throws IOException, InterruptedException {
-               checkState(!bufferBuilders[targetChannel].isPresent() || bufferBuilders[targetChannel].get().isFinished());
+       /**
+        * Requests a new {@link BufferBuilder} for the target channel and returns it.
+        */
+       abstract BufferBuilder requestNewBufferBuilder(int targetChannel) throws IOException, InterruptedException;

-               BufferBuilder bufferBuilder = targetPartition.getBufferBuilder();
-               bufferBuilders[targetChannel] = Optional.of(bufferBuilder);
-               targetPartition.addBufferConsumer(bufferBuilder.createBufferConsumer(), targetChannel);
-               return bufferBuilder;
-       }
+       /**
+        * Marks the current {@link BufferBuilder} as finished if present and clears the state for next one.
+        */
+       abstract void tryFinishCurrentBufferBuilder(int targetChannel);

-       private void closeBufferBuilder(int targetChannel) {
-               if (bufferBuilders[targetChannel].isPresent()) {
-                       bufferBuilders[targetChannel].get().finish();
-                       bufferBuilders[targetChannel] = Optional.empty();
-               }
-       }
+       /**
+        * Marks the current {@link BufferBuilder} as empty for the target channel.
+        */
+       abstract void emptyCurrentBufferBuilder(int targetChannel);
+
+       /**
+        * Marks the current {@link BufferBuilder} as finished and releases the resources for the target channel.
+        */
+       abstract void closeBufferBuilder(int targetChannel);
+
+       /**
+        * Closes the {@link BufferBuilder}s for all the channels.
+        */
+       public abstract void clearBuffers();

        /**
         * Closes the writer. This stops the flushing thread (if there is one).
@@ -296,7 +259,7 @@ private void notifyFlusherException(Throwable t) {
                }
        }

-       private void checkErroneous() throws IOException {
+       protected void checkErroneous() throws IOException {
                if (flusherException != null) {
                        throw new IOException("An exception happened while flushing the outputs", flusherException);
                }
diff --git a/flink-runtime/src/main/java/org/apache/flink/runtime/io/network/api/writer/RecordWriterBuilder.java b/flink-runtime/src/main/java/org/apache/flink/runtime/io/network/api/writer/RecordWriterBuilder.java
index 79b372b6bc21b..365ca2096e93f 100644
--- a/flink-runtime/src/main/java/org/apache/flink/runtime/io/network/api/writer/RecordWriterBuilder.java
+++ b/flink-runtime/src/main/java/org/apache/flink/runtime/io/network/api/writer/RecordWriterBuilder.java
@@ -46,9 +46,9 @@ public RecordWriterBuilder setTaskName(String taskName) {

        public RecordWriter build(ResultPartitionWriter writer) {
                if (selector.isBroadcast()) {
-                       return new BroadcastRecordWriter(writer, selector, timeout, taskName);
+                       return new BroadcastRecordWriter(writer, timeout, taskName);
                } else {
-                       return new RecordWriter(writer, selector, timeout, taskName);
+                       return new ChannelSelectorRecordWriter(writer, selector, timeout, taskName);
                }
        }
 }
diff --git a/flink-runtime/src/main/java/org/apache/flink/runtime/io/network/buffer/BufferBuilder.java b/flink-runtime/src/main/java/org/apache/flink/runtime/io/network/buffer/BufferBuilder.java
index 6fb067ef8c36b..bcd42d23b1ba9 100644
--- a/flink-runtime/src/main/java/org/apache/flink/runtime/io/network/buffer/BufferBuilder.java
+++ b/flink-runtime/src/main/java/org/apache/flink/runtime/io/network/buffer/BufferBuilder.java
@@ -40,24 +40,23 @@ public class BufferBuilder {

        private final SettablePositionMarker positionMarker = new SettablePositionMarker();

-       private boolean bufferConsumerCreated = false;
-
        public BufferBuilder(MemorySegment memorySegment, BufferRecycler recycler) {
                this.memorySegment = checkNotNull(memorySegment);
                this.recycler = checkNotNull(recycler);
        }

        /**
-        * @return created matching instance of {@link BufferConsumer} to this {@link BufferBuilder}. There can exist only
-        * one {@link BufferConsumer} per each {@link BufferBuilder} and vice versa.
+        * This method always creates a {@link BufferConsumer} starting from the current writer offset. Data written to
+        * {@link BufferBuilder} before creation of {@link BufferConsumer} won't be visible for that {@link BufferConsumer}.
+        *
+        * @return created matching instance of {@link BufferConsumer} to this {@link BufferBuilder}.
         */
        public BufferConsumer createBufferConsumer() {
-               checkState(!bufferConsumerCreated, "There can not exists two BufferConsumer for one BufferBuilder");
-               bufferConsumerCreated = true;
                return new BufferConsumer(
                        memorySegment,
                        recycler,
-                       positionMarker);
+                       positionMarker,
+                       positionMarker.cachedPosition);
        }

        /**
diff --git a/flink-runtime/src/main/java/org/apache/flink/runtime/io/network/buffer/BufferConsumer.java b/flink-runtime/src/main/java/org/apache/flink/runtime/io/network/buffer/BufferConsumer.java
index b58a627dfe145..c06c2337469e4 100644
--- a/flink-runtime/src/main/java/org/apache/flink/runtime/io/network/buffer/BufferConsumer.java
+++ b/flink-runtime/src/main/java/org/apache/flink/runtime/io/network/buffer/BufferConsumer.java
@@ -45,16 +45,17 @@ public class BufferConsumer implements Closeable {
        private int currentReaderPosition;

        /**
-        * Constructs {@link BufferConsumer} instance with content that can be changed by {@link BufferBuilder}.
+        * Constructs {@link BufferConsumer} instance with the initial reader position.
         */
        public BufferConsumer(
                        MemorySegment memorySegment,
                        BufferRecycler recycler,
-                       PositionMarker currentWriterPosition) {
+                       PositionMarker currentWriterPosition,
+                       int currentReaderPosition) {
                this(
                        new NetworkBuffer(checkNotNull(memorySegment), checkNotNull(recycler), true),
                        currentWriterPosition,
-                       0);
+                       currentReaderPosition);
        }

        /**
@@ -136,6 +137,10 @@ public int getWrittenBytes() {
                return writerPosition.getCached();
        }

+       int getCurrentReaderPosition() {
+               return currentReaderPosition;
+       }
+
        /**
         * Cached reading wrapper around {@link PositionMarker}.
         *
diff --git a/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/api/writer/BroadcastRecordWriterTest.java b/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/api/writer/BroadcastRecordWriterTest.java
new file mode 100644
index 0000000000000..d95b87c836cf2
--- /dev/null
+++ b/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/api/writer/BroadcastRecordWriterTest.java
@@ -0,0 +1,112 @@
+/*
+ * Licensed to the Apache Software Foundation (ASF) under one
+ * or more contributor license agreements.  See the NOTICE file
+ * distributed with this work for additional information
+ * regarding copyright ownership.  The ASF licenses this file
+ * to you under the Apache License, Version 2.0 (the
+ * "License"); you may not use this file except in compliance
+ * with the License.  You may obtain a copy of the License at
+ *
+ *     http://www.apache.org/licenses/LICENSE-2.0
+ *
+ * Unless required by applicable law or agreed to in writing, software
+ * distributed under the License is distributed on an "AS IS" BASIS,
+ * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
+ * See the License for the specific language governing permissions and
+ * limitations under the License.
+ */
+
+package org.apache.flink.runtime.io.network.api.writer;
+
+import org.apache.flink.core.io.IOReadableWritable;
+import org.apache.flink.runtime.io.network.api.serialization.RecordDeserializer;
+import org.apache.flink.runtime.io.network.api.serialization.SpillingAdaptiveSpanningRecordDeserializer;
+import org.apache.flink.runtime.io.network.buffer.BufferConsumer;
+import org.apache.flink.runtime.io.network.util.TestPooledBufferProvider;
+import org.apache.flink.testutils.serialization.types.SerializationTestType;
+import org.apache.flink.testutils.serialization.types.SerializationTestTypeFactory;
+import org.apache.flink.testutils.serialization.types.Util;
+
+import org.junit.Test;
+
+import java.util.ArrayDeque;
+import java.util.HashMap;
+import java.util.Map;
+import java.util.Queue;
+
+import static org.junit.Assert.assertEquals;
+
+/**
+ * Tests for the {@link BroadcastRecordWriter}.
+ */
+public class BroadcastRecordWriterTest extends RecordWriterTest {
+
+       public BroadcastRecordWriterTest() {
+               super(true);
+       }
+
+       /**
+        * Tests the number of requested buffers and results are correct in the case of switching
+        * modes between {@link BroadcastRecordWriter#broadcastEmit(IOReadableWritable)} and
+        * {@link BroadcastRecordWriter#randomEmit(IOReadableWritable)}.
+        */
+       @Test
+       public void testBroadcastMixedRandomEmitRecord() throws Exception {
+               final int numberOfChannels = 4;
+               final int numberOfRecords = 8;
+               final int bufferSize = 32;
+
+               @SuppressWarnings("unchecked")
+               final Queue<BufferConsumer>[] queues = new Queue[numberOfChannels];
+               for (int i = 0; i < numberOfChannels; i++) {
+                       queues[i] = new ArrayDeque<>();
+               }
+
+               final TestPooledBufferProvider bufferProvider = new TestPooledBufferProvider(Integer.MAX_VALUE, bufferSize);
+               final ResultPartitionWriter partitionWriter = new CollectingPartitionWriter(queues, bufferProvider);
+               final BroadcastRecordWriter<SerializationTestType> writer = new BroadcastRecordWriter<>(partitionWriter, 0, "test");
+               final RecordDeserializer<SerializationTestType> deserializer = new SpillingAdaptiveSpanningRecordDeserializer<>(
+                       new String[]{ tempFolder.getRoot().getAbsolutePath() });
+
+               // generate the configured number of int values as global record set
+               final Iterable<SerializationTestType> records = Util.randomRecords(numberOfRecords, SerializationTestTypeFactory.INT);
+               // restore the corresponding record set for every input channel
+               final Map<Integer, ArrayDeque<SerializationTestType>> serializedRecords = new HashMap<>();
+               for (int i = 0; i < numberOfChannels; i++) {
+                       serializedRecords.put(i, new ArrayDeque<>());
+               }
+
+               // every record in global set would both emit into one random channel and broadcast to all the channels
+               int index = 0;
+               for (SerializationTestType record : records) {
+                       int randomChannel = index++ % numberOfChannels;
+                       writer.randomEmit(record, randomChannel);
+                       serializedRecords.get(randomChannel).add(record);
+
+                       writer.broadcastEmit(record);
+                       for (int i = 0; i < numberOfChannels; i++) {
+                               serializedRecords.get(i).add(record);
+                       }
+               }
+
+               final int numberOfCreatedBuffers = bufferProvider.getNumberOfCreatedBuffers();
+               // verify the expected number of requested buffers, and it would always request a new buffer while random emitting
+               assertEquals(numberOfRecords, numberOfCreatedBuffers);
+
+               for (int i = 0; i < numberOfChannels; i++) {
+                       // every channel would queue the number of above crated buffers
+                       assertEquals(numberOfRecords, queues[i].size());
+
+                       final int excessRandomRecords = i < numberOfRecords % numberOfChannels ? 1 : 0;
+                       final int numberOfRandomRecords = numberOfRecords / numberOfChannels + excessRandomRecords;
+                       final int numberOfTotalRecords = numberOfRecords + numberOfRandomRecords;
+                       // verify the data correctness in every channel queue
+                       verifyDeserializationResults(
+                               queues[i],
+                               deserializer,
+                               serializedRecords.get(i),
+                               numberOfCreatedBuffers,
+                               numberOfTotalRecords);
+               }
+       }
+}
diff --git a/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/api/writer/RecordWriterTest.java b/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/api/writer/RecordWriterTest.java
index 882f83c5a9bf4..239c47d3a5cf6 100644
--- a/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/api/writer/RecordWriterTest.java
+++ b/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/api/writer/RecordWriterTest.java
@@ -83,6 +83,16 @@
  */
 public class RecordWriterTest {

+       private final boolean isBroadcastWriter;
+
+       public RecordWriterTest() {
+               this(false);
+       }
+
+       RecordWriterTest(boolean isBroadcastWriter) {
+               this.isBroadcastWriter = isBroadcastWriter;
+       }
+
        @Rule
        public TemporaryFolder tempFolder = new TemporaryFolder();

@@ -132,7 +142,7 @@ public BufferBuilder answer(InvocationOnMock invocation) throws Throwable {

                        ResultPartitionWriter partitionWriter = new RecyclingPartitionWriter(bufferProvider);

-                       final RecordWriter<IntValue> recordWriter = new RecordWriterBuilder().build(partitionWriter);
+                       final RecordWriter<IntValue> recordWriter = createRecordWriter(partitionWriter);

                        Future<?> result = executor.submit(new Callable<Void>() {
                                @Override
@@ -184,7 +194,7 @@ public void testSerializerClearedAfterClearBuffers() throws Exception {
                ResultPartitionWriter partitionWriter =
                        spy(new RecyclingPartitionWriter(new TestPooledBufferProvider(1, 16)));

-               RecordWriter<IntValue> recordWriter = new RecordWriterBuilder().build(partitionWriter);
+               RecordWriter<IntValue> recordWriter = createRecordWriter(partitionWriter);

                // Fill a buffer, but don't write it out.
                recordWriter.emit(new IntValue(0));
@@ -214,7 +224,7 @@ public void testBroadcastEventNoRecords() throws Exception {
                TestPooledBufferProvider bufferProvider = new TestPooledBufferProvider(Integer.MAX_VALUE, bufferSize);

                ResultPartitionWriter partitionWriter = new CollectingPartitionWriter(queues, bufferProvider);
-               RecordWriter<ByteArrayIO> writer = new RecordWriterBuilder().build(partitionWriter);
+               RecordWriter<ByteArrayIO> writer = createRecordWriter(partitionWriter);
                CheckpointBarrier barrier = new CheckpointBarrier(Integer.MAX_VALUE + 919192L, Integer.MAX_VALUE + 18828228L, CheckpointOptions.forCheckpointWithDefaultLocation());

                // No records emitted yet, broadcast should not request a buffer
@@ -251,53 +261,66 @@ public void testBroadcastEventMixedRecords() throws Exception {
                TestPooledBufferProvider bufferProvider = new TestPooledBufferProvider(Integer.MAX_VALUE, bufferSize);

                ResultPartitionWriter partitionWriter = new CollectingPartitionWriter(queues, bufferProvider);
-               RecordWriter<ByteArrayIO> writer = new RecordWriterBuilder().build(partitionWriter);
+               RecordWriter<ByteArrayIO> writer = createRecordWriter(partitionWriter);
                CheckpointBarrier barrier = new CheckpointBarrier(Integer.MAX_VALUE + 1292L, Integer.MAX_VALUE + 199L, CheckpointOptions.forCheckpointWithDefaultLocation());

                // Emit records on some channels first (requesting buffers), then
                // broadcast the event. The record buffers should be emitted first, then
                // the event. After the event, no new buffer should be requested.

-               // (i) Smaller than the buffer size (single buffer request => 1)
+               // (i) Smaller than the buffer size
                byte[] bytes = new byte[bufferSize / 2];
                rand.nextBytes(bytes);

                writer.emit(new ByteArrayIO(bytes));

-               // (ii) Larger than the buffer size (two buffer requests => 1 + 2)
+               // (ii) Larger than the buffer size
                bytes = new byte[bufferSize + 1];
                rand.nextBytes(bytes);

                writer.emit(new ByteArrayIO(bytes));

-               // (iii) Exactly the buffer size (single buffer request => 1 + 2 + 1)
+               // (iii) Exactly the buffer size
                bytes = new byte[bufferSize - lenBytes];
                rand.nextBytes(bytes);

                writer.emit(new ByteArrayIO(bytes));

-               // (iv) Nothing on the 4th channel (no buffer request => 1 + 2 + 1 + 0 = 4)
-
-               // (v) Broadcast the event
+               // (iv) Broadcast the event
                writer.broadcastEvent(barrier);

-               assertEquals(4, bufferProvider.getNumberOfCreatedBuffers());
+               if (isBroadcastWriter) {
+                       assertEquals(3, bufferProvider.getNumberOfCreatedBuffers());

-               BufferOrEvent boe;
-               assertEquals(2, queues[0].size()); // 1 buffer + 1 event
-               assertTrue(parseBuffer(queues[0].remove(), 0).isBuffer());
-               assertEquals(3, queues[1].size()); // 2 buffers + 1 event
-               assertTrue(parseBuffer(queues[1].remove(), 1).isBuffer());
-               assertTrue(parseBuffer(queues[1].remove(), 1).isBuffer());
-               assertEquals(2, queues[2].size()); // 1 buffer + 1 event
-               assertTrue(parseBuffer(queues[2].remove(), 2).isBuffer());
-               assertEquals(1, queues[3].size()); // 0 buffers + 1 event
+                       for (int i = 0; i < numberOfChannels; i++) {
+                               assertEquals(4, queues[i].size()); // 3 buffer + 1 event

-               // every queue's last element should be the event
-               for (int i = 0; i < numberOfChannels; i++) {
-                       boe = parseBuffer(queues[i].remove(), i);
-                       assertTrue(boe.isEvent());
-                       assertEquals(barrier, boe.getEvent());
+                               for (int j = 0; j < 3; j++) {
+                                       assertTrue(parseBuffer(queues[i].remove(), 0).isBuffer());
+                               }
+
+                               BufferOrEvent boe = parseBuffer(queues[i].remove(), i);
+                               assertTrue(boe.isEvent());
+                               assertEquals(barrier, boe.getEvent());
+                       }
+               } else {
+                       assertEquals(4, bufferProvider.getNumberOfCreatedBuffers());
+
+                       assertEquals(2, queues[0].size()); // 1 buffer + 1 event
+                       assertTrue(parseBuffer(queues[0].remove(), 0).isBuffer());
+                       assertEquals(3, queues[1].size()); // 2 buffers + 1 event
+                       assertTrue(parseBuffer(queues[1].remove(), 1).isBuffer());
+                       assertTrue(parseBuffer(queues[1].remove(), 1).isBuffer());
+                       assertEquals(2, queues[2].size()); // 1 buffer + 1 event
+                       assertTrue(parseBuffer(queues[2].remove(), 2).isBuffer());
+                       assertEquals(1, queues[3].size()); // 0 buffers + 1 event
+
+                       // every queue's last element should be the event
+                       for (int i = 0; i < numberOfChannels; i++) {
+                               BufferOrEvent boe = parseBuffer(queues[i].remove(), i);
+                               assertTrue(boe.isEvent());
+                               assertEquals(barrier, boe.getEvent());
+                       }
                }
        }

@@ -313,7 +336,7 @@ public void testBroadcastEventBufferReferenceCounting() throws Exception {

                ResultPartitionWriter partition =
                        new CollectingPartitionWriter(queues, new TestPooledBufferProvider(Integer.MAX_VALUE));
-               RecordWriter<?> writer = new RecordWriterBuilder().build(partition);
+               RecordWriter<?> writer = createRecordWriter(partition);

                writer.broadcastEvent(EndOfPartitionEvent.INSTANCE);

@@ -352,21 +375,46 @@ public void testBroadcastEmitBufferIndependence() throws Exception {
                verifyBroadcastBufferOrEventIndependence(false);
        }

-       /**
-        * Tests that records are broadcast via {@link ChannelSelector} and
-        * {@link RecordWriter#emit(IOReadableWritable)}.
-        */
-       @Test
-       public void testEmitRecordWithBroadcastPartitioner() throws Exception {
-               emitRecordWithBroadcastPartitionerOrBroadcastEmitRecord(false);
-       }
-
        /**
         * Tests that records are broadcast via {@link RecordWriter#broadcastEmit(IOReadableWritable)}.
         */
        @Test
        public void testBroadcastEmitRecord() throws Exception {
-               emitRecordWithBroadcastPartitionerOrBroadcastEmitRecord(true);
+               final int numberOfChannels = 4;
+               final int bufferSize = 32;
+               final int numValues = 8;
+               final int serializationLength = 4;
+
+               @SuppressWarnings("unchecked")
+               final Queue<BufferConsumer>[] queues = new Queue[numberOfChannels];
+               for (int i = 0; i < numberOfChannels; i++) {
+                       queues[i] = new ArrayDeque<>();
+               }
+
+               final TestPooledBufferProvider bufferProvider = new TestPooledBufferProvider(Integer.MAX_VALUE, bufferSize);
+               final ResultPartitionWriter partitionWriter = new CollectingPartitionWriter(queues, bufferProvider);
+               final RecordWriter<SerializationTestType> writer = createRecordWriter(partitionWriter);
+               final RecordDeserializer<SerializationTestType> deserializer = new SpillingAdaptiveSpanningRecordDeserializer<>(
+                       new String[]{ tempFolder.getRoot().getAbsolutePath() });
+
+               final ArrayDeque<SerializationTestType> serializedRecords = new ArrayDeque<>();
+               final Iterable<SerializationTestType> records = Util.randomRecords(numValues, SerializationTestTypeFactory.INT);
+               for (SerializationTestType record : records) {
+                       serializedRecords.add(record);
+                       writer.broadcastEmit(record);
+               }
+
+               final int numRequiredBuffers = numValues / (bufferSize / (4 + serializationLength));
+               if (isBroadcastWriter) {
+                       assertEquals(numRequiredBuffers, bufferProvider.getNumberOfCreatedBuffers());
+               } else {
+                       assertEquals(numRequiredBuffers * numberOfChannels, bufferProvider.getNumberOfCreatedBuffers());
+               }
+
+               for (int i = 0; i < numberOfChannels; i++) {
+                       assertEquals(numRequiredBuffers, queues[i].size());
+                       verifyDeserializationResults(queues[i], deserializer, serializedRecords.clone(), numRequiredBuffers, numValues);
+               }
        }

        private void verifyBroadcastBufferOrEventIndependence(boolean broadcastEvent) throws Exception {
@@ -375,7 +423,7 @@ private void verifyBroadcastBufferOrEventIndependence(boolean broadcastEvent) th

                ResultPartitionWriter partition =
                        new CollectingPartitionWriter(queues, new TestPooledBufferProvider(Integer.MAX_VALUE));
-               RecordWriter<IntValue> writer = new RecordWriterBuilder().build(partition);
+               RecordWriter<IntValue> writer = createRecordWriter(partition);

                if (broadcastEvent) {
                        writer.broadcastEvent(EndOfPartitionEvent.INSTANCE);
@@ -396,59 +444,32 @@ private void verifyBroadcastBufferOrEventIndependence(boolean broadcastEvent) th
                assertEquals("Buffer 2 shares the same reader index as buffer 1", 0, buffer2.getReaderIndex());
        }

-       /**
-        * The results of emitting records via BroadcastPartitioner or broadcasting records directly are the same,
-        * that is all the target channels can receive the whole outputs.
-        *
-        * @param isBroadcastEmit whether using {@link RecordWriter#broadcastEmit(IOReadableWritable)} or not
-        */
-       private void emitRecordWithBroadcastPartitionerOrBroadcastEmitRecord(boolean isBroadcastEmit) throws Exception {
-               final int numberOfChannels = 4;
-               final int bufferSize = 32;
-               final int numValues = 8;
-               final int serializationLength = 4;
+       protected void verifyDeserializationResults(
+                       Queue<BufferConsumer> queue,
+                       RecordDeserializer<SerializationTestType> deserializer,
+                       ArrayDeque<SerializationTestType> expectedRecords,
+                       int numRequiredBuffers,
+                       int numValues) throws Exception {
+               int assertRecords = 0;
+               for (int j = 0; j < numRequiredBuffers; j++) {
+                       Buffer buffer = buildSingleBuffer(queue.remove());
+                       deserializer.setNextBuffer(buffer);

-               @SuppressWarnings("unchecked")
-               final Queue<BufferConsumer>[] queues = new Queue[numberOfChannels];
-               for (int i = 0; i < numberOfChannels; i++) {
-                       queues[i] = new ArrayDeque<>();
+                       assertRecords += DeserializationUtils.deserializeRecords(expectedRecords, deserializer);
                }
+               Assert.assertEquals(numValues, assertRecords);
+       }

-               final TestPooledBufferProvider bufferProvider = new TestPooledBufferProvider(Integer.MAX_VALUE, bufferSize);
-               final ResultPartitionWriter partitionWriter = new CollectingPartitionWriter(queues, bufferProvider);
-               final ChannelSelector selector = new OutputEmitter(ShipStrategyType.BROADCAST, 0);
-               final RecordWriter<SerializationTestType> writer = new RecordWriterBuilder()
-                       .setChannelSelector(selector)
-                       .setTimeout(0)
-                       .build(partitionWriter);
-               final RecordDeserializer<SerializationTestType> deserializer = new SpillingAdaptiveSpanningRecordDeserializer<>(
-                       new String[]{ tempFolder.getRoot().getAbsolutePath() });
-
-               final ArrayDeque<SerializationTestType> serializedRecords = new ArrayDeque<>();
-               final Iterable<SerializationTestType> records = Util.randomRecords(numValues, SerializationTestTypeFactory.INT);
-               for (SerializationTestType record : records) {
-                       serializedRecords.add(record);
-
-                       if (isBroadcastEmit) {
-                               writer.broadcastEmit(record);
-                       } else {
-                               writer.emit(record);
-                       }
-               }
-
-               final int requiredBuffers = numValues / (bufferSize / (4 + serializationLength));
-               for (int i = 0; i < numberOfChannels; i++) {
-                       assertEquals(requiredBuffers, queues[i].size());
-
-                       final ArrayDeque<SerializationTestType> expectedRecords = serializedRecords.clone();
-                       int assertRecords = 0;
-                       for (int j = 0; j < requiredBuffers; j++) {
-                               Buffer buffer = buildSingleBuffer(queues[i].remove());
-                               deserializer.setNextBuffer(buffer);
-
-                               assertRecords += DeserializationUtils.deserializeRecords(expectedRecords, deserializer);
-                       }
-                       Assert.assertEquals(numValues, assertRecords);
+       /**
+        * Creates the {@link RecordWriter} instance based on whether it is a broadcast writer.
+        */
+       private RecordWriter createRecordWriter(ResultPartitionWriter writer) {
+               if (isBroadcastWriter) {
+                       return new RecordWriterBuilder()
+                               .setChannelSelector(new OutputEmitter(ShipStrategyType.BROADCAST, 0))
+                               .build(writer);
+               } else {
+                       return new RecordWriterBuilder().build(writer);
                }
        }

@@ -459,7 +480,7 @@ private void emitRecordWithBroadcastPartitionerOrBroadcastEmitRecord(boolean isB
        /**
         * Partition writer that collects the added buffers/events in multiple queue.
         */
-       private static class CollectingPartitionWriter implements ResultPartitionWriter {
+       static class CollectingPartitionWriter implements ResultPartitionWriter {
                private final Queue<BufferConsumer>[] queues;
                private final BufferProvider bufferProvider;
                private final ResultPartitionID partitionId = new ResultPartitionID();
@@ -470,7 +491,7 @@ private static class CollectingPartitionWriter implements ResultPartitionWriter
                 * @param queues one queue per outgoing channel
                 * @param bufferProvider buffer provider
                 */
-               private CollectingPartitionWriter(Queue<BufferConsumer>[] queues, BufferProvider bufferProvider) {
+               CollectingPartitionWriter(Queue<BufferConsumer>[] queues, BufferProvider bufferProvider) {
                        this.queues = queues;
                        this.bufferProvider = bufferProvider;
                }
diff --git a/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/buffer/BufferBuilderAndConsumerTest.java b/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/buffer/BufferBuilderAndConsumerTest.java
index b5d9da0f1aa3e..3975a71f72056 100644
--- a/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/buffer/BufferBuilderAndConsumerTest.java
+++ b/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/buffer/BufferBuilderAndConsumerTest.java
@@ -57,6 +57,7 @@ public void referenceCounting() {
        @Test
        public void append() {
                BufferBuilder bufferBuilder = createBufferBuilder();
+               BufferConsumer bufferConsumer = bufferBuilder.createBufferConsumer();

                int[] intsToWrite = new int[] {0, 1, 2, 3, 42};
                ByteBuffer bytesToWrite = toByteBuffer(intsToWrite);
@@ -66,7 +67,7 @@ public void append() {
                assertEquals(bytesToWrite.limit(), bytesToWrite.position());
                assertFalse(bufferBuilder.isFull());

-               assertContent(bufferBuilder.createBufferConsumer(), intsToWrite);
+               assertContent(bufferConsumer, intsToWrite);
        }

        @Test
@@ -116,11 +117,21 @@ public void appendOverSize() {
                assertContent(bufferConsumer, 42);
        }

-       @Test(expected = IllegalStateException.class)
+       @Test
        public void creatingBufferConsumerTwice() {
                BufferBuilder bufferBuilder = createBufferBuilder();
-               bufferBuilder.createBufferConsumer();
-               bufferBuilder.createBufferConsumer();
+               BufferConsumer bufferConsumer1 = bufferBuilder.createBufferConsumer();
+
+               assertEquals(0, bufferConsumer1.getCurrentReaderPosition());
+               assertContent(bufferConsumer1);
+
+               ByteBuffer bytesToWrite = toByteBuffer(0, 1);
+               bufferBuilder.appendAndCommit(bytesToWrite);
+               BufferConsumer bufferConsumer2 = bufferBuilder.createBufferConsumer();
+               bufferBuilder.appendAndCommit(toByteBuffer(2));
+
+               assertEquals(bytesToWrite.position(), bufferConsumer2.getCurrentReaderPosition());
+               assertContent(bufferConsumer2, 2);
        }

        @Test
diff --git a/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/buffer/BufferBuilderTestUtils.java b/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/buffer/BufferBuilderTestUtils.java
index 7696e08ad87df..331854c4b8e9d 100644
--- a/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/buffer/BufferBuilderTestUtils.java
+++ b/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/buffer/BufferBuilderTestUtils.java
@@ -41,10 +41,6 @@ public static BufferBuilder createBufferBuilder(int size) {
                return createFilledBufferBuilder(size, 0);
        }

-       public static BufferBuilder createFilledBufferBuilder(int dataSize) {
-               return createFilledBufferBuilder(BUFFER_SIZE, dataSize);
-       }
-
        public static BufferBuilder createFilledBufferBuilder(int size, int dataSize) {
                checkArgument(size >= dataSize);
                BufferBuilder bufferBuilder = new BufferBuilder(
@@ -70,14 +66,26 @@ public static Buffer buildSingleBuffer(BufferConsumer bufferConsumer) {
                return buffer;
        }

-       public static BufferConsumer createFilledBufferConsumer(int size, int dataSize) {
-               BufferBuilder bufferBuilder = createFilledBufferBuilder(size, dataSize);
-               bufferBuilder.finish();
-               return bufferBuilder.createBufferConsumer();
+       public static BufferConsumer createFilledFinishedBufferConsumer(int dataSize) {
+               return createFilledBufferConsumer(dataSize, dataSize, true);
        }

-       public static BufferConsumer createFilledBufferConsumer(int dataSize) {
-               return createFilledBufferConsumer(BUFFER_SIZE, dataSize);
+       public static BufferConsumer createFilledUnfinishedBufferConsumer(int dataSize) {
+               return createFilledBufferConsumer(dataSize, dataSize, false);
+       }
+
+       public static BufferConsumer createFilledBufferConsumer(int size, int dataSize, boolean isFinished) {
+               checkArgument(size >= dataSize);
+
+               BufferBuilder bufferBuilder = createBufferBuilder(size);
+               BufferConsumer bufferConsumer = bufferBuilder.createBufferConsumer();
+               fillBufferBuilder(bufferBuilder, dataSize);
+
+               if (isFinished) {
+                       bufferBuilder.finish();
+               }
+
+               return bufferConsumer;
        }

        public static BufferConsumer createEventBufferConsumer(int size) {
diff --git a/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/BoundedBlockingSubpartitionAvailabilityTest.java b/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/BoundedBlockingSubpartitionAvailabilityTest.java
index 915cf43faed92..1110ccad53481 100644
--- a/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/BoundedBlockingSubpartitionAvailabilityTest.java
+++ b/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/BoundedBlockingSubpartitionAvailabilityTest.java
@@ -134,7 +134,7 @@ private static BoundedBlockingSubpartition createPartitionWithData(int numberOfB

        private static void writeBuffers(ResultSubpartition partition, int numberOfBuffers) throws IOException {
                for (int i = 0; i < numberOfBuffers; i++) {
-                       partition.add(BufferBuilderTestUtils.createFilledBufferConsumer(BUFFER_SIZE, BUFFER_SIZE));
+                       partition.add(BufferBuilderTestUtils.createFilledFinishedBufferConsumer(BUFFER_SIZE));
                }
        }

diff --git a/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/FileChannelBoundedDataTest.java b/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/FileChannelBoundedDataTest.java
index 1ca2bc8eeb056..c088d2542be2b 100755
--- a/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/FileChannelBoundedDataTest.java
+++ b/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/FileChannelBoundedDataTest.java
@@ -32,7 +32,7 @@
 import java.nio.file.Path;

 import static org.apache.flink.runtime.io.network.buffer.BufferBuilderTestUtils.buildSomeBuffer;
-import static org.apache.flink.runtime.io.network.buffer.BufferBuilderTestUtils.createFilledBufferConsumer;
+import static org.apache.flink.runtime.io.network.buffer.BufferBuilderTestUtils.createFilledFinishedBufferConsumer;
 import static org.junit.Assert.assertFalse;
 import static org.junit.Assert.assertNotNull;
 import static org.junit.Assert.assertNull;
@@ -173,7 +173,7 @@ private static void writeBuffers(BoundedData data, int numberOfBuffers) throws I

        private static void writeBuffers(ResultSubpartition subpartition, int numberOfBuffers) throws IOException {
                for (int i = 0; i < numberOfBuffers; i++) {
-                       subpartition.add(createFilledBufferConsumer(BUFFER_SIZE, BUFFER_SIZE));
+                       subpartition.add(createFilledFinishedBufferConsumer(BUFFER_SIZE));
                }
                subpartition.finish();
        }
diff --git a/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/InputGateFairnessTest.java b/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/InputGateFairnessTest.java
index da05f8395438a..45e33481570e6 100644
--- a/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/InputGateFairnessTest.java
+++ b/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/InputGateFairnessTest.java
@@ -47,7 +47,7 @@
 import java.util.HashSet;
 import java.util.Optional;

-import static org.apache.flink.runtime.io.network.buffer.BufferBuilderTestUtils.createFilledBufferConsumer;
+import static org.apache.flink.runtime.io.network.buffer.BufferBuilderTestUtils.createFilledFinishedBufferConsumer;
 import static org.apache.flink.runtime.io.network.partition.InputChannelTestUtils.createDummyConnectionManager;
 import static org.apache.flink.runtime.io.network.partition.InputChannelTestUtils.createLocalInputChannel;
 import static org.apache.flink.runtime.io.network.partition.InputChannelTestUtils.createResultPartitionManager;
@@ -68,7 +68,7 @@ public void testFairConsumptionLocalChannelsPreFilled() throws Exception {
                final int buffersPerChannel = 27;

                final ResultPartition resultPartition = mock(ResultPartition.class);
-               final BufferConsumer bufferConsumer = createFilledBufferConsumer(42);
+               final BufferConsumer bufferConsumer = createFilledFinishedBufferConsumer(42);

                // ----- create some source channels and fill them with buffers -----

@@ -122,7 +122,7 @@ public void testFairConsumptionLocalChannels() throws Exception {
                final int buffersPerChannel = 27;

                final ResultPartition resultPartition = mock(ResultPartition.class);
-               try (BufferConsumer bufferConsumer = createFilledBufferConsumer(42)) {
+               try (BufferConsumer bufferConsumer = createFilledFinishedBufferConsumer(42)) {

                        // ----- create some source channels and fill them with one buffer each -----

diff --git a/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/PartitionTestUtils.java b/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/PartitionTestUtils.java
index 42b0b1a83848f..a29f50f197b64 100644
--- a/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/PartitionTestUtils.java
+++ b/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/PartitionTestUtils.java
@@ -31,7 +31,7 @@

 import java.io.IOException;

-import static org.apache.flink.runtime.io.network.buffer.BufferBuilderTestUtils.createFilledBufferConsumer;
+import static org.apache.flink.runtime.io.network.buffer.BufferBuilderTestUtils.createFilledFinishedBufferConsumer;
 import static org.junit.Assert.assertThat;
 import static org.junit.Assert.fail;

@@ -117,7 +117,7 @@ public static void writeBuffers(
                        int numberOfBuffers,
                        int bufferSize) throws IOException {
                for (int i = 0; i < numberOfBuffers; i++) {
-                       partition.addBufferConsumer(createFilledBufferConsumer(bufferSize, bufferSize), 0);
+                       partition.addBufferConsumer(createFilledFinishedBufferConsumer(bufferSize), 0);
                }
                partition.finish();
        }
diff --git a/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/PipelinedSubpartitionTest.java b/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/PipelinedSubpartitionTest.java
index ff15b420c9367..21e085d707bbe 100644
--- a/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/PipelinedSubpartitionTest.java
+++ b/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/PipelinedSubpartitionTest.java
@@ -46,7 +46,7 @@
 import java.util.concurrent.Executors;
 import java.util.concurrent.TimeUnit;

-import static org.apache.flink.runtime.io.network.buffer.BufferBuilderTestUtils.createFilledBufferConsumer;
+import static org.apache.flink.runtime.io.network.buffer.BufferBuilderTestUtils.createFilledFinishedBufferConsumer;
 import static org.apache.flink.util.Preconditions.checkState;
 import static org.junit.Assert.assertEquals;
 import static org.junit.Assert.assertFalse;
@@ -160,6 +160,7 @@ public BufferConsumerAndChannel getNextBufferConsumer() throws Exception {
                                }

                                final BufferBuilder bufferBuilder = bufferProvider.requestBufferBuilderBlocking();
+                               final BufferConsumer bufferConsumer = bufferBuilder.createBufferConsumer();
                                int segmentSize = bufferBuilder.getMaxCapacity();

                                MemorySegment segment = MemorySegmentFactory.allocateUnpooledSegment(segmentSize);
@@ -176,7 +177,7 @@ public BufferConsumerAndChannel getNextBufferConsumer() throws Exception {

                                numberOfBuffers++;

-                               return new BufferConsumerAndChannel(bufferBuilder.createBufferConsumer(), 0);
+                               return new BufferConsumerAndChannel(bufferConsumer, 0);
                        }
                };

@@ -250,8 +251,8 @@ public void testCleanupReleasedPartitionWithView() throws Exception {
        private void testCleanupReleasedPartition(boolean createView) throws Exception {
                PipelinedSubpartition partition = createSubpartition();

-               BufferConsumer buffer1 = createFilledBufferConsumer(4096);
-               BufferConsumer buffer2 = createFilledBufferConsumer(4096);
+               BufferConsumer buffer1 = createFilledFinishedBufferConsumer(4096);
+               BufferConsumer buffer2 = createFilledFinishedBufferConsumer(4096);
                boolean buffer1Recycled;
                boolean buffer2Recycled;
                try {
@@ -306,7 +307,7 @@ public void testReleaseParentAfterSpilled() throws Exception {

        private void verifyViewReleasedAfterParentRelease(ResultSubpartition partition) throws Exception {
                // Add a bufferConsumer
-               BufferConsumer bufferConsumer = createFilledBufferConsumer(BufferBuilderTestUtils.BUFFER_SIZE);
+               BufferConsumer bufferConsumer = createFilledFinishedBufferConsumer(BufferBuilderTestUtils.BUFFER_SIZE);
                partition.add(bufferConsumer);
                partition.finish();

diff --git a/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/PipelinedSubpartitionWithReadViewTest.java b/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/PipelinedSubpartitionWithReadViewTest.java
index 56945016cad6c..26d3f76052e36 100644
--- a/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/PipelinedSubpartitionWithReadViewTest.java
+++ b/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/PipelinedSubpartitionWithReadViewTest.java
@@ -31,12 +31,11 @@
 import javax.annotation.Nullable;

 import java.io.IOException;
-import java.nio.ByteBuffer;

 import static org.apache.flink.runtime.io.network.buffer.BufferBuilderTestUtils.createBufferBuilder;
 import static org.apache.flink.runtime.io.network.buffer.BufferBuilderTestUtils.createEventBufferConsumer;
-import static org.apache.flink.runtime.io.network.buffer.BufferBuilderTestUtils.createFilledBufferBuilder;
-import static org.apache.flink.runtime.io.network.buffer.BufferBuilderTestUtils.createFilledBufferConsumer;
+import static org.apache.flink.runtime.io.network.buffer.BufferBuilderTestUtils.createFilledFinishedBufferConsumer;
+import static org.apache.flink.runtime.io.network.buffer.BufferBuilderTestUtils.createFilledUnfinishedBufferConsumer;
 import static org.apache.flink.runtime.io.network.util.TestBufferFactory.BUFFER_SIZE;
 import static org.apache.flink.util.Preconditions.checkArgument;
 import static org.hamcrest.MatcherAssert.assertThat;
@@ -106,9 +105,7 @@ public void testAddEmptyNonFinishedBuffer() {
        public void testAddNonEmptyNotFinishedBuffer() throws Exception {
                assertEquals(0, availablityListener.getNumNotifications());

-               BufferBuilder bufferBuilder = createBufferBuilder();
-               bufferBuilder.appendAndCommit(ByteBuffer.allocate(1024));
-               subpartition.add(bufferBuilder.createBufferConsumer());
+               subpartition.add(createFilledUnfinishedBufferConsumer(1024));

                // note that since the buffer builder is not finished, there is still a retained instance!
                assertEquals(0, subpartition.getBuffersInBacklog());
@@ -121,8 +118,8 @@ public void testAddNonEmptyNotFinishedBuffer() throws Exception {
         */
        @Test
        public void testUnfinishedBufferBehindFinished() throws Exception {
-               subpartition.add(createFilledBufferConsumer(1025)); // finished
-               subpartition.add(createFilledBufferBuilder(1024).createBufferConsumer()); // not finished
+               subpartition.add(createFilledFinishedBufferConsumer(1025)); // finished
+               subpartition.add(createFilledUnfinishedBufferConsumer(1024)); // not finished

                assertEquals(1, subpartition.getBuffersInBacklog());
                assertThat(availablityListener.getNumNotifications(), greaterThan(0L));
@@ -138,8 +135,8 @@ public void testUnfinishedBufferBehindFinished() throws Exception {
         */
        @Test
        public void testFlushWithUnfinishedBufferBehindFinished() throws Exception {
-               subpartition.add(createFilledBufferConsumer(1025)); // finished
-               subpartition.add(createFilledBufferBuilder(1024).createBufferConsumer()); // not finished
+               subpartition.add(createFilledFinishedBufferConsumer(1025)); // finished
+               subpartition.add(createFilledUnfinishedBufferConsumer(1024)); // not finished
                long oldNumNotifications = availablityListener.getNumNotifications();

                assertEquals(1, subpartition.getBuffersInBacklog());
@@ -164,8 +161,8 @@ public void testFlushWithUnfinishedBufferBehindFinished2() throws Exception {
                subpartition.flush();
                assertEquals(0, availablityListener.getNumNotifications());

-               subpartition.add(createFilledBufferConsumer(1025)); // finished
-               subpartition.add(createFilledBufferBuilder(1024).createBufferConsumer()); // not finished
+               subpartition.add(createFilledFinishedBufferConsumer(1025)); // finished
+               subpartition.add(createFilledUnfinishedBufferConsumer(1024)); // not finished

                assertEquals(1, subpartition.getBuffersInBacklog());
                assertNextBuffer(readView, 1025, false, 0, false, true);
@@ -187,18 +184,18 @@ public void testFlushWithUnfinishedBufferBehindFinished2() throws Exception {
        public void testMultipleEmptyBuffers() throws Exception {
                assertEquals(0, availablityListener.getNumNotifications());

-               subpartition.add(createFilledBufferConsumer(0));
+               subpartition.add(createFilledFinishedBufferConsumer(0));
+               assertEquals(0, availablityListener.getNumNotifications());

+               subpartition.add(createFilledFinishedBufferConsumer(0));
                assertEquals(1, availablityListener.getNumNotifications());
-               subpartition.add(createFilledBufferConsumer(0));
-               assertEquals(2, availablityListener.getNumNotifications());

-               subpartition.add(createFilledBufferConsumer(0));
-               assertEquals(2, availablityListener.getNumNotifications());
+               subpartition.add(createFilledFinishedBufferConsumer(0));
+               assertEquals(1, availablityListener.getNumNotifications());
                assertEquals(2, subpartition.getBuffersInBacklog());

-               subpartition.add(createFilledBufferConsumer(1024));
-               assertEquals(2, availablityListener.getNumNotifications());
+               subpartition.add(createFilledFinishedBufferConsumer(1024));
+               assertEquals(1, availablityListener.getNumNotifications());

                assertNextBuffer(readView, 1024, false, 0, false, true);
        }
@@ -218,15 +215,14 @@ public void testBasicPipelinedProduceConsumeLogic() throws Exception {
                assertEquals(0, availablityListener.getNumNotifications());

                // Add data to the queue...
-               subpartition.add(createFilledBufferConsumer(BUFFER_SIZE));
+               subpartition.add(createFilledFinishedBufferConsumer(BUFFER_SIZE));
                assertFalse(readView.nextBufferIsEvent());

                assertEquals(1, subpartition.getTotalNumberOfBuffers());
                assertEquals(0, subpartition.getBuffersInBacklog());
                assertEquals(0, subpartition.getTotalNumberOfBytes()); // only updated when getting the buffer

-               // ...should have resulted in a notification
-               assertEquals(1, availablityListener.getNumNotifications());
+               assertEquals(0, availablityListener.getNumNotifications());

                // ...and one available result
                assertNextBuffer(readView, BUFFER_SIZE, false, 0, false, true);
@@ -236,13 +232,13 @@ public void testBasicPipelinedProduceConsumeLogic() throws Exception {
                assertEquals(0, subpartition.getBuffersInBacklog());

                // Add data to the queue...
-               subpartition.add(createFilledBufferConsumer(BUFFER_SIZE));
+               subpartition.add(createFilledFinishedBufferConsumer(BUFFER_SIZE));
                assertFalse(readView.nextBufferIsEvent());

                assertEquals(2, subpartition.getTotalNumberOfBuffers());
                assertEquals(0, subpartition.getBuffersInBacklog());
                assertEquals(BUFFER_SIZE, subpartition.getTotalNumberOfBytes()); // only updated when getting the buffer
-               assertEquals(2, availablityListener.getNumNotifications());
+               assertEquals(0, availablityListener.getNumNotifications());

                assertNextBuffer(readView, BUFFER_SIZE, false, 0, false, true);
                assertEquals(2 * BUFFER_SIZE, subpartition.getTotalNumberOfBytes()); // only updated when getting the buffer
@@ -253,17 +249,17 @@ public void testBasicPipelinedProduceConsumeLogic() throws Exception {
                // some tests with events

                // fill with: buffer, event, and buffer
-               subpartition.add(createFilledBufferConsumer(BUFFER_SIZE));
+               subpartition.add(createFilledFinishedBufferConsumer(BUFFER_SIZE));
                assertFalse(readView.nextBufferIsEvent());
                subpartition.add(createEventBufferConsumer(BUFFER_SIZE));
                assertFalse(readView.nextBufferIsEvent());
-               subpartition.add(createFilledBufferConsumer(BUFFER_SIZE));
+               subpartition.add(createFilledFinishedBufferConsumer(BUFFER_SIZE));
                assertFalse(readView.nextBufferIsEvent());

                assertEquals(5, subpartition.getTotalNumberOfBuffers());
                assertEquals(1, subpartition.getBuffersInBacklog()); // two buffers (events don't count)
                assertEquals(2 * BUFFER_SIZE, subpartition.getTotalNumberOfBytes()); // only updated when getting the buffer
-               assertEquals(4, availablityListener.getNumNotifications());
+               assertEquals(1, availablityListener.getNumNotifications());

                // the first buffer
                assertNextBuffer(readView, BUFFER_SIZE, true, 0, true, true);
@@ -271,7 +267,7 @@ public void testBasicPipelinedProduceConsumeLogic() throws Exception {
                assertEquals(0, subpartition.getBuffersInBacklog());

                // the event
-               assertNextEvent(readView, BUFFER_SIZE, null, true, 0, false, true);
+               assertNextEvent(readView, BUFFER_SIZE, null, false, 0, false, true);
                assertEquals(4 * BUFFER_SIZE, subpartition.getTotalNumberOfBytes()); // only updated when getting the buffer
                assertEquals(0, subpartition.getBuffersInBacklog());

@@ -286,7 +282,7 @@ public void testBasicPipelinedProduceConsumeLogic() throws Exception {

                assertEquals(5, subpartition.getTotalNumberOfBuffers());
                assertEquals(5 * BUFFER_SIZE, subpartition.getTotalNumberOfBytes());
-               assertEquals(4, availablityListener.getNumNotifications());
+               assertEquals(1, availablityListener.getNumNotifications());
        }

        @Test
@@ -308,11 +304,10 @@ private void testBacklogConsistentWithNumberOfConsumableBuffers(boolean isFlushR
                final int numberOfAddedBuffers = 5;

                for (int i = 1; i <= numberOfAddedBuffers; i++) {
-                       final BufferBuilder bufferBuilder = createFilledBufferBuilder(BUFFER_SIZE);
-                       subpartition.add(bufferBuilder.createBufferConsumer());
-
                        if (i < numberOfAddedBuffers || isFinished) {
-                               bufferBuilder.finish();
+                               subpartition.add(createFilledFinishedBufferConsumer(1024));
+                       } else {
+                               subpartition.add(createFilledUnfinishedBufferConsumer(1024));
                        }
                }

diff --git a/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/ResultPartitionTest.java b/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/ResultPartitionTest.java
index dc693e53a95e6..0b1e9a0c98c1b 100644
--- a/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/ResultPartitionTest.java
+++ b/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/ResultPartitionTest.java
@@ -40,7 +40,7 @@
 import java.io.IOException;
 import java.util.Collections;

-import static org.apache.flink.runtime.io.network.buffer.BufferBuilderTestUtils.createFilledBufferConsumer;
+import static org.apache.flink.runtime.io.network.buffer.BufferBuilderTestUtils.createFilledFinishedBufferConsumer;
 import static org.apache.flink.runtime.io.network.partition.PartitionTestUtils.createPartition;
 import static org.apache.flink.runtime.io.network.partition.PartitionTestUtils.verifyCreateSubpartitionViewThrowsException;
 import static org.hamcrest.MatcherAssert.assertThat;
@@ -90,7 +90,7 @@ public void testSendScheduleOrUpdateConsumersMessage() throws Exception {
                                taskActions,
                                jobId,
                                notifier);
-                       consumableNotifyingPartitionWriter.addBufferConsumer(createFilledBufferConsumer(BufferBuilderTestUtils.BUFFER_SIZE), 0);
+                       consumableNotifyingPartitionWriter.addBufferConsumer(createFilledFinishedBufferConsumer(BufferBuilderTestUtils.BUFFER_SIZE), 0);
                        verify(notifier, times(1))
                                .notifyPartitionConsumable(eq(jobId), eq(consumableNotifyingPartitionWriter.getPartitionId()), eq(taskActions));
                }
@@ -103,7 +103,7 @@ public void testSendScheduleOrUpdateConsumersMessage() throws Exception {
                                taskActions,
                                jobId,
                                notifier);
-                       partition.addBufferConsumer(createFilledBufferConsumer(BufferBuilderTestUtils.BUFFER_SIZE), 0);
+                       partition.addBufferConsumer(createFilledFinishedBufferConsumer(BufferBuilderTestUtils.BUFFER_SIZE), 0);
                        verify(notifier, never()).notifyPartitionConsumable(eq(jobId), eq(partition.getPartitionId()), eq(taskActions));
                }
        }
@@ -151,7 +151,7 @@ public void testBlockingPartitionIsConsumableMultipleTimesIfNotReleasedOnConsump
         * @param partitionType the result partition type to set up
         */
        private void testAddOnFinishedPartition(final ResultPartitionType partitionType) throws Exception {
-               BufferConsumer bufferConsumer = createFilledBufferConsumer(BufferBuilderTestUtils.BUFFER_SIZE);
+               BufferConsumer bufferConsumer = createFilledFinishedBufferConsumer(BufferBuilderTestUtils.BUFFER_SIZE);
                ResultPartitionConsumableNotifier notifier = mock(ResultPartitionConsumableNotifier.class);
                JobID jobId = new JobID();
                TaskActions taskActions = new NoOpTaskActions();
@@ -197,7 +197,7 @@ public void testAddOnReleasedBlockingPartition() throws Exception {
         * @param partitionType the result partition type to set up
         */
        private void testAddOnReleasedPartition(final ResultPartitionType partitionType) throws Exception {
-               BufferConsumer bufferConsumer = createFilledBufferConsumer(BufferBuilderTestUtils.BUFFER_SIZE);
+               BufferConsumer bufferConsumer = createFilledFinishedBufferConsumer(BufferBuilderTestUtils.BUFFER_SIZE);
                ResultPartitionConsumableNotifier notifier = mock(ResultPartitionConsumableNotifier.class);
                JobID jobId = new JobID();
                TaskActions taskActions = new NoOpTaskActions();
@@ -267,7 +267,7 @@ private void testAddOnPartition(final ResultPartitionType partitionType) throws
                        taskActions,
                        jobId,
                        notifier);
-               BufferConsumer bufferConsumer = createFilledBufferConsumer(BufferBuilderTestUtils.BUFFER_SIZE);
+               BufferConsumer bufferConsumer = createFilledFinishedBufferConsumer(BufferBuilderTestUtils.BUFFER_SIZE);
                try {
                        // partition.add() adds the bufferConsumer without recycling it (if not spilling)
                        consumableNotifyingPartitionWriter.addBufferConsumer(bufferConsumer, 0);
diff --git a/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/SubpartitionTestBase.java b/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/SubpartitionTestBase.java
index 13cab65bb9c71..2fef1828e078c 100644
--- a/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/SubpartitionTestBase.java
+++ b/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/SubpartitionTestBase.java
@@ -24,7 +24,7 @@

 import org.junit.Test;

-import static org.apache.flink.runtime.io.network.buffer.BufferBuilderTestUtils.createFilledBufferConsumer;
+import static org.apache.flink.runtime.io.network.buffer.BufferBuilderTestUtils.createFilledFinishedBufferConsumer;
 import static org.junit.Assert.assertEquals;
 import static org.junit.Assert.assertFalse;
 import static org.junit.Assert.assertTrue;
@@ -70,7 +70,7 @@ public void testAddAfterFinish() throws Exception {
                        assertEquals(1, subpartition.getTotalNumberOfBuffers());
                        assertEquals(0, subpartition.getBuffersInBacklog());

-                       BufferConsumer bufferConsumer = createFilledBufferConsumer(4096, 4096);
+                       BufferConsumer bufferConsumer = createFilledFinishedBufferConsumer(4096);

                        assertFalse(subpartition.add(bufferConsumer));
                        assertTrue(bufferConsumer.isRecycled());
@@ -91,7 +91,7 @@ public void testAddAfterRelease() throws Exception {
                try {
                        subpartition.release();

-                       BufferConsumer bufferConsumer = createFilledBufferConsumer(4096, 4096);
+                       BufferConsumer bufferConsumer = createFilledFinishedBufferConsumer(4096);

                        assertFalse(subpartition.add(bufferConsumer));
                        assertTrue(bufferConsumer.isRecycled());
@@ -106,7 +106,7 @@ public void testAddAfterRelease() throws Exception {
        @Test
        public void testReleasingReaderDoesNotReleasePartition() throws Exception {
                final ResultSubpartition partition = createSubpartition();
-               partition.add(createFilledBufferConsumer(BufferBuilderTestUtils.BUFFER_SIZE));
+               partition.add(createFilledFinishedBufferConsumer(BufferBuilderTestUtils.BUFFER_SIZE));
                partition.finish();

                final ResultSubpartitionView reader = partition.createReadView(new NoOpBufferAvailablityListener());
@@ -125,7 +125,7 @@ public void testReleasingReaderDoesNotReleasePartition() throws Exception {
        @Test
        public void testReleaseIsIdempotent() throws Exception {
                final ResultSubpartition partition = createSubpartition();
-               partition.add(createFilledBufferConsumer(BufferBuilderTestUtils.BUFFER_SIZE));
+               partition.add(createFilledFinishedBufferConsumer(BufferBuilderTestUtils.BUFFER_SIZE));
                partition.finish();

                partition.release();
@@ -136,7 +136,7 @@ public void testReleaseIsIdempotent() throws Exception {
        @Test
        public void testReadAfterDispose() throws Exception {
                final ResultSubpartition partition = createSubpartition();
-               partition.add(createFilledBufferConsumer(BufferBuilderTestUtils.BUFFER_SIZE));
+               partition.add(createFilledFinishedBufferConsumer(BufferBuilderTestUtils.BUFFER_SIZE));
                partition.finish();

                final ResultSubpartitionView reader = partition.createReadView(new NoOpBufferAvailablityListener());
@@ -154,7 +154,7 @@ public void testReadAfterDispose() throws Exception {
        public void testRecycleBufferAndConsumerOnFailure() throws Exception {
                final ResultSubpartition subpartition = createFailingWritesSubpartition();
                try {
-                       final BufferConsumer consumer = BufferBuilderTestUtils.createFilledBufferConsumer(100);
+                       final BufferConsumer consumer = BufferBuilderTestUtils.createFilledFinishedBufferConsumer(100);

                        try {
                                subpartition.add(consumer);
diff --git a/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/consumer/IteratorWrappingTestSingleInputGate.java b/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/consumer/IteratorWrappingTestSingleInputGate.java
index d691f3e22d8bf..4cbc6c8b23578 100644
--- a/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/consumer/IteratorWrappingTestSingleInputGate.java
+++ b/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/consumer/IteratorWrappingTestSingleInputGate.java
@@ -24,6 +24,7 @@
 import org.apache.flink.runtime.io.network.api.serialization.RecordSerializer;
 import org.apache.flink.runtime.io.network.api.serialization.SpanningRecordSerializer;
 import org.apache.flink.runtime.io.network.buffer.BufferBuilder;
+import org.apache.flink.runtime.io.network.buffer.BufferConsumer;
 import org.apache.flink.runtime.io.network.partition.consumer.InputChannel.BufferAndAvailability;
 import org.apache.flink.runtime.io.network.partition.consumer.TestInputChannel.BufferAndAvailabilityProvider;
 import org.apache.flink.runtime.jobgraph.IntermediateResultPartitionID;
@@ -33,7 +34,6 @@
 import java.io.IOException;
 import java.util.Optional;

-import static org.apache.flink.runtime.io.network.buffer.BufferBuilderTestUtils.buildSingleBuffer;
 import static org.apache.flink.runtime.io.network.buffer.BufferBuilderTestUtils.createBufferBuilder;

 /**
@@ -77,12 +77,13 @@ public Optional<BufferAndAvailability> getBufferAvailability() throws IOExceptio
                                if (hasData) {
                                        serializer.serializeRecord(reuse);
                                        BufferBuilder bufferBuilder = createBufferBuilder(bufferSize);
+                                       BufferConsumer bufferConsumer = bufferBuilder.createBufferConsumer();
                                        serializer.copyToBufferBuilder(bufferBuilder);

                                        hasData = inputIterator.next(reuse) != null;

                                        // Call getCurrentBuffer to ensure size is set
-                                       return Optional.of(new BufferAndAvailability(buildSingleBuffer(bufferBuilder), true, 0));
+                                       return Optional.of(new BufferAndAvailability(bufferConsumer.build(), true, 0));
                                } else {
                                        inputChannel.setReleased();

diff --git a/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/consumer/LocalInputChannelTest.java b/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/consumer/LocalInputChannelTest.java
index dc8b501d87833..d049f9b0a7451 100644
--- a/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/consumer/LocalInputChannelTest.java
+++ b/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/consumer/LocalInputChannelTest.java
@@ -22,6 +22,7 @@
 import org.apache.flink.runtime.execution.CancelTaskException;
 import org.apache.flink.runtime.io.network.TaskEventDispatcher;
 import org.apache.flink.runtime.io.network.buffer.BufferBuilder;
+import org.apache.flink.runtime.io.network.buffer.BufferConsumer;
 import org.apache.flink.runtime.io.network.buffer.BufferPool;
 import org.apache.flink.runtime.io.network.buffer.BufferProvider;
 import org.apache.flink.runtime.io.network.buffer.NetworkBufferPool;
@@ -465,9 +466,10 @@ public BufferConsumerAndChannel getNextBufferConsumer() throws Exception {
                        if (channelIndexes.size() > 0) {
                                final int channelIndex = channelIndexes.remove(0);
                                BufferBuilder bufferBuilder = bufferProvider.requestBufferBuilderBlocking();
+                               BufferConsumer bufferConsumer = bufferBuilder.createBufferConsumer();
                                bufferBuilder.appendAndCommit(ByteBuffer.wrap(new byte[4]));
                                bufferBuilder.finish();
-                               return new BufferConsumerAndChannel(bufferBuilder.createBufferConsumer(), channelIndex);
+                               return new BufferConsumerAndChannel(bufferConsumer, channelIndex);
                        }

                        return null;
diff --git a/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/consumer/SingleInputGateTest.java b/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/consumer/SingleInputGateTest.java
index 3a8e4f23efc89..57f0a17b2392d 100644
--- a/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/consumer/SingleInputGateTest.java
+++ b/flink-runtime/src/test/java/org/apache/flink/runtime/io/network/partition/consumer/SingleInputGateTest.java
@@ -594,7 +594,7 @@ public void testQueuedBuffers() throws Exception {
                        remoteInputChannel.onBuffer(TestBufferFactory.createBuffer(1), 0, 0);
                        assertEquals(1, inputGate.getNumberOfQueuedBuffers());

-                       resultPartition.addBufferConsumer(BufferBuilderTestUtils.createFilledBufferConsumer(1), 0);
+                       resultPartition.addBufferConsumer(BufferBuilderTestUtils.createFilledFinishedBufferConsumer(1), 0);
                        assertEquals(2, inputGate.getNumberOfQueuedBuffers());
                } finally {
                        resultPartition.release();
diff --git a/flink-streaming-java/src/test/java/org/apache/flink/runtime/io/network/partition/consumer/StreamTestSingleInputGate.java b/flink-streaming-java/src/test/java/org/apache/flink/runtime/io/network/partition/consumer/StreamTestSingleInputGate.java
index 291e15ccd6771..d3754fde19af1 100644
--- a/flink-streaming-java/src/test/java/org/apache/flink/runtime/io/network/partition/consumer/StreamTestSingleInputGate.java
+++ b/flink-streaming-java/src/test/java/org/apache/flink/runtime/io/network/partition/consumer/StreamTestSingleInputGate.java
@@ -27,6 +27,7 @@
 import org.apache.flink.runtime.io.network.api.serialization.RecordSerializer;
 import org.apache.flink.runtime.io.network.api.serialization.SpanningRecordSerializer;
 import org.apache.flink.runtime.io.network.buffer.BufferBuilder;
+import org.apache.flink.runtime.io.network.buffer.BufferConsumer;
 import org.apache.flink.runtime.io.network.partition.consumer.InputChannel.BufferAndAvailability;
 import org.apache.flink.runtime.io.network.partition.consumer.TestInputChannel.BufferAndAvailabilityProvider;
 import org.apache.flink.runtime.jobgraph.IntermediateResultPartitionID;
@@ -38,7 +39,6 @@
 import java.util.Optional;
 import java.util.concurrent.ConcurrentLinkedQueue;

-import static org.apache.flink.runtime.io.network.buffer.BufferBuilderTestUtils.buildSingleBuffer;
 import static org.apache.flink.runtime.io.network.buffer.BufferBuilderTestUtils.createBufferBuilder;

 /**
@@ -106,11 +106,12 @@ private void setupInputChannels() throws IOException, InterruptedException {
                                        delegate.setInstance(inputElement);
                                        recordSerializer.serializeRecord(delegate);
                                        BufferBuilder bufferBuilder = createBufferBuilder(bufferSize);
+                                       BufferConsumer bufferConsumer = bufferBuilder.createBufferConsumer();
                                        recordSerializer.copyToBufferBuilder(bufferBuilder);
                                        bufferBuilder.finish();

                                        // Call getCurrentBuffer to ensure size is set
-                                       return Optional.of(new BufferAndAvailability(buildSingleBuffer(bufferBuilder), moreAvailable, 0));
+                                       return Optional.of(new BufferAndAvailability(bufferConsumer.build(), moreAvailable, 0));
                                } else if (input != null && input.isEvent()) {
                                        AbstractEvent event = input.getEvent();
                                        if (event instanceof EndOfPartitionEvent) {
diff --git a/flink-streaming-java/src/test/java/org/apache/flink/streaming/runtime/io/StreamTaskNetworkInputTest.java b/flink-streaming-java/src/test/java/org/apache/flink/streaming/runtime/io/StreamTaskNetworkInputTest.java
index 17b9e063e82b2..d4ba08ff93da7 100644
--- a/flink-streaming-java/src/test/java/org/apache/flink/streaming/runtime/io/StreamTaskNetworkInputTest.java
+++ b/flink-streaming-java/src/test/java/org/apache/flink/streaming/runtime/io/StreamTaskNetworkInputTest.java
@@ -25,9 +25,9 @@
 import org.apache.flink.runtime.io.network.api.serialization.RecordSerializer;
 import org.apache.flink.runtime.io.network.api.serialization.SpanningRecordSerializer;
 import org.apache.flink.runtime.io.network.api.serialization.SpillingAdaptiveSpanningRecordDeserializer;
-import org.apache.flink.runtime.io.network.buffer.Buffer;
 import org.apache.flink.runtime.io.network.buffer.BufferBuilder;
 import org.apache.flink.runtime.io.network.buffer.BufferBuilderTestUtils;
+import org.apache.flink.runtime.io.network.buffer.BufferConsumer;
 import org.apache.flink.runtime.io.network.partition.consumer.BufferOrEvent;
 import org.apache.flink.runtime.io.network.partition.consumer.StreamTestSingleInputGate;
 import org.apache.flink.runtime.plugable.DeserializationDelegate;
@@ -74,13 +74,12 @@ public void tearDown() throws Exception {
        @Test
        public void testIsAvailableWithBufferedDataInDeserializer() throws Exception {
                BufferBuilder bufferBuilder = BufferBuilderTestUtils.createEmptyBufferBuilder(PAGE_SIZE);
+               BufferConsumer bufferConsumer = bufferBuilder.createBufferConsumer();

                serializeRecord(42L, bufferBuilder);
                serializeRecord(44L, bufferBuilder);

-               Buffer buffer = bufferBuilder.createBufferConsumer().build();
-
-               List<BufferOrEvent> buffers = Collections.singletonList(new BufferOrEvent(buffer, 0, false));
+               List<BufferOrEvent> buffers = Collections.singletonList(new BufferOrEvent(bufferConsumer.build(), 0, false));

                VerifyRecordsDataOutput output = new VerifyRecordsDataOutput<>();
                StreamTaskNetworkInput input = new StreamTaskNetworkInput<>(
`;

const DEFAULT_COMMIT_1 = `[FLINK-10995][runtime] Copy intermediate serialization results only once for broadcast mode

The behavior of current channel selector is either for one channel or all the channels for broadcast mode.
In broadcast mode, the intermediate serialization results would be copied into every BufferBuilder requested
for every sub partition, so this would affect the performance seriously especially in large scale jobs.

We can copy to only one target BufferBuilder and the corresponding BufferConsumer would be shared by all the
sub partitions to improve the performance. For mixed operations with broadcast and non-broadcast, we should
finish the previous BufferBuilder first before transforming from broadcast to non-broadcast, vice versa.
`;


const DEFAULT_DIFF_2 = `diff --git a/components/camel-undertow/src/main/java/org/apache/camel/component/undertow/UndertowComponent.java b/components/camel-undertow/src/main/java/org/apache/camel/component/undertow/UndertowComponent.java
index d0b7003b865a3..faa2b4c81d22f 100644
--- a/components/camel-undertow/src/main/java/org/apache/camel/component/undertow/UndertowComponent.java
+++ b/components/camel-undertow/src/main/java/org/apache/camel/component/undertow/UndertowComponent.java
@@ -19,7 +19,6 @@
 import java.net.URI;
 import java.net.URISyntaxException;
 import java.util.HashMap;
-import java.util.HashSet;
 import java.util.LinkedHashSet;
 import java.util.Locale;
 import java.util.Map;`;

const DEFAULT_COMMIT_2 = "Fix flaky test due to unordered set";



export default {DEFAULT_DIFF_1, DEFAULT_COMMIT_1, DEFAULT_DIFF_2, DEFAULT_COMMIT_2};