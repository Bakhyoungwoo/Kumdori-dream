package com.ourcut.job.domain;

import com.ourcut.user.domain.User;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ComposeJobStateTest {
    @Test
    void followsPendingToQueuedToProcessingToDone() {
        ComposeJob job = new ComposeJob(new User("state@example.com", "state"), null,
            PipelineType.CV, MediaType.IMAGE, null, 1, "state-key");

        job.queue();
        job.start();
        job.updateProgress(50);
        job.complete();

        assertThat(job.getStatus()).isEqualTo(ComposeJobStatus.DONE);
        assertThat(job.getProgress()).isEqualTo(100);
    }

    @Test
    void rejectsTerminalStateOverwrite() {
        ComposeJob job = new ComposeJob(new User("terminal@example.com", "terminal"), null,
            PipelineType.CV, MediaType.IMAGE, null, 1, "terminal-key");
        job.queue();
        job.start();
        job.complete();

        assertThatThrownBy(() -> job.fail("late-error"))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("DONE -> FAILED");
    }

    @Test
    void timeoutIsTerminalAndCannotBeCanceled() {
        ComposeJob job = new ComposeJob(new User("timeout@example.com", "timeout"), null,
            PipelineType.CV, MediaType.IMAGE, null, 1, "timeout-key");
        job.queue();
        job.timeout();

        assertThat(job.getStatus()).isEqualTo(ComposeJobStatus.ENGINE_TIMEOUT);
        assertThatThrownBy(job::cancel).isInstanceOf(IllegalStateException.class);
    }
}
